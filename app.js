import {
  auth,
  db,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  doc,
  setDoc,
  getDoc,
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy
} from "./firebase.js";

const email = document.getElementById("email");
const password = document.getElementById("password");

window.signup = async () => {
  const role = document.getElementById("role").value;

  const userCred = await createUserWithEmailAndPassword(
    auth,
    email.value,
    password.value
  );

  await setDoc(doc(db, "users", userCred.user.uid), {
    email: email.value,
    role: role,
    profileComplete: false
  });

  window.location = "profile.html";
};

window.login = async () => {
  const userCred = await signInWithEmailAndPassword(
    auth,
    email.value,
    password.value
  );

  const userDoc = await getDoc(doc(db, "users", userCred.user.uid));

  if (!userDoc.data().profileComplete) {
    window.location = "profile.html";
  } else {
    window.location = "dashboard.html";
  }
};

window.saveProfile = async () => {
  const user = auth.currentUser;

  const name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const skills = Array.from(
    document.getElementById("skills").selectedOptions
  ).map(o => o.value);

  const privacy = document.getElementById("privacy").value;

  await setDoc(doc(db, "users", user.uid), {
    name,
    phone,
    skills,
    privacy,
    profileComplete: true
  }, { merge: true });

  window.location = "dashboard.html";
};

window.sendMessage = async () => {
  const msg = document.getElementById("msg").value;

  await addDoc(collection(db, "messages"), {
    text: msg,
    createdAt: new Date()
  });

  document.getElementById("msg").value = "";
};

const chatBox = document.getElementById("chatBox");

if (chatBox) {
  const q = query(collection(db, "messages"), orderBy("createdAt"));

  onSnapshot(q, snapshot => {
    chatBox.innerHTML = "";
    snapshot.forEach(doc => {
      chatBox.innerHTML += `<p>${doc.data().text}</p>`;
    });
  });
}

window.createCommunity = async () => {
  const name = prompt("Community Name");
  const purpose = prompt("Purpose");

  await addDoc(collection(db, "communities"), {
    name,
    purpose,
    paid: true
  });

  alert("Community Created!");
};

const communityList = document.getElementById("communityList");

if (communityList) {
  onSnapshot(collection(db, "communities"), snapshot => {
    communityList.innerHTML = "";
    snapshot.forEach(doc => {
      const data = doc.data();
      communityList.innerHTML += `<li>${data.name} - ${data.purpose}</li>`;
    });
  });
}
