import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  onSnapshot,
  query,
  orderBy
} from "./firebase.js";

let currentRoomId = null;

/* ================= INIT BUTTON LISTENERS ================= */

document.addEventListener("DOMContentLoaded", () => {

  const createBtn = document.getElementById("createRoomBtn");
  if (createBtn) {
    createBtn.addEventListener("click", createStudyRoom);
  }

  const sendBtn = document.getElementById("sendRoomMsgBtn");
  if (sendBtn) {
    sendBtn.addEventListener("click", sendRoomMessage);
  }

  loadStudyRooms();
});

/* ================= CREATE ROOM ================= */

async function createStudyRoom() {
  const user = auth.currentUser;
  if (!user) return alert("Login first");

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const creatorName = userSnap.data()?.name || "User";

  const meetLink = `https://meet.google.com/${Math.random()
    .toString(36)
    .substring(2, 10)}`;

  const roomRef = await addDoc(collection(db, "studyRooms"), {
    creatorId: user.uid,
    creatorName,
    meetLink,
    members: [user.uid],
    createdAt: new Date(),
    active: true
  });

  currentRoomId = roomRef.id;
  alert("Squad Created 🚀");
}

/* ================= LOAD ROOMS ================= */

function loadStudyRooms() {
  const studyRoomList = document.getElementById("studyRoomList");
  if (!studyRoomList) return;

  onSnapshot(collection(db, "studyRooms"), (snapshot) => {
    studyRoomList.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (!data.active) return;

      const li = document.createElement("li");

      const nameSpan = document.createElement("span");
      nameSpan.textContent = `${data.creatorName}'s Squad`;

      const joinBtn = document.createElement("button");
      joinBtn.textContent = "Join";
      joinBtn.addEventListener("click", () =>
        joinRoom(docSnap.id, data.meetLink)
      );

      li.appendChild(nameSpan);
      li.appendChild(joinBtn);
      studyRoomList.appendChild(li);
    });
  });
}

/* ================= JOIN ROOM ================= */

async function joinRoom(roomId, meetLink) {
  const user = auth.currentUser;
  if (!user) return;

  const roomRef = doc(db, "studyRooms", roomId);
  const roomSnap = await getDoc(roomRef);
  if (!roomSnap.exists()) return;

  const roomData = roomSnap.data();

  if (!roomData.members.includes(user.uid)) {
    await setDoc(
      roomRef,
      { members: [...roomData.members, user.uid] },
      { merge: true }
    );
  }

  currentRoomId = roomId;

  // Open Google Meet
  window.open(meetLink, "_blank");

  loadRoomChat();
}

/* ================= ROOM CHAT ================= */

function loadRoomChat() {
  if (!currentRoomId) return;

  const chatBox = document.getElementById("roomChat");
  if (!chatBox) return;

  const q = query(
    collection(db, "studyRooms", currentRoomId, "messages"),
    orderBy("createdAt")
  );

  onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = "";

    snapshot.forEach((docSnap) => {
      const data = docSnap.data();

      const div = document.createElement("div");
      div.className = "chat-message";
      div.innerHTML = `
        <strong>${data.sender}</strong>
        <p>${data.text}</p>
      `;

      chatBox.appendChild(div);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

/* ================= SEND ROOM MESSAGE ================= */

async function sendRoomMessage() {
  if (!currentRoomId) return alert("Join a room first");

  const msgInput = document.getElementById("roomMsg");
  if (!msgInput || !msgInput.value.trim()) return;

  const user = auth.currentUser;
  if (!user) return;

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const senderName = userSnap.data()?.name || "User";

  await addDoc(
    collection(db, "studyRooms", currentRoomId, "messages"),
    {
      text: msgInput.value.trim(),
      sender: senderName,
      createdAt: new Date()
    }
  );

  msgInput.value = "";
}
