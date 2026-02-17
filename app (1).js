import {
  auth,
  db,
  storage,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  doc,
  setDoc,
  getDoc,
  getDocs,          // ✅ include here
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  where,
  ref,
  uploadBytes,
  getDownloadURL
} from "./firebase.js";
import { supabase } from "./supabase.js";

let selectedUserId = null;
let unsubscribeChat = null;


/* ================= AUTH STATE ================= */

auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  const userRef = doc(db, "users", user.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) return;

  const data = userSnap.data();

  console.log("Logged in as:", data.role);
});


/* ================= SIGNUP ================= */

window.signup = async () => {
  try {
    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;
    const role = document.getElementById("role")?.value;

    const userCred = await createUserWithEmailAndPassword(auth, email, password);

    await setDoc(doc(db, "users", userCred.user.uid), {
      email,
      role,
      profileComplete: false
    });

    window.location.href =
      role === "teacher" ? "teacher-profile.html" : "profile.html";

  } catch (error) {
    alert(error.message);
  }
};


/* ================= LOGIN ================= */

window.login = async () => {
  try {
    const email = document.getElementById("email")?.value;
    const password = document.getElementById("password")?.value;

    const userCred = await signInWithEmailAndPassword(auth, email, password);
    const userSnap = await getDoc(doc(db, "users", userCred.user.uid));

    if (!userSnap.exists()) {
      alert("User record missing.");
      return;
    }

    const data = userSnap.data();

    if (data.role === "teacher") {
      window.location.href = data.profileComplete
        ? "teacher-dashboard.html"
        : "teacher-profile.html";
    } else {
      window.location.href = data.profileComplete
        ? "dashboard.html"
        : "profile.html";
    }

  } catch (error) {
    alert(error.message);
  }
};


/* ================= STUDENT PROFILE ================= */

window.saveProfile = async () => {
  const user = auth.currentUser;
  if (!user) return;

  await setDoc(doc(db, "users", user.uid), {
    name: document.getElementById("name")?.value,
    phone: document.getElementById("phone")?.value,
    skills: Array.from(
      document.getElementById("skills")?.selectedOptions || []
    ).map(o => o.value),
    privacy: document.getElementById("privacy")?.value,
    role: "student",
    profileComplete: true
  }, { merge: true });

  window.location.href = "dashboard.html";
};


/* ================= TEACHER PROFILE ================= */

window.saveTeacherProfile = async () => {
  const user = auth.currentUser;
  if (!user) return;

  let course = document.getElementById("course")?.value;
  if (course === "Other") {
    course = document.getElementById("otherCourse")?.value;
  }

  await setDoc(doc(db, "users", user.uid), {
    name: document.getElementById("tname")?.value,
    phone: document.getElementById("tphone")?.value,
    course,
    semesters: Array.from(
      document.getElementById("semesters")?.selectedOptions || []
    ).map(o => o.value),
    role: "teacher",
    profileComplete: true
  }, { merge: true });

  window.location.href = "teacher-dashboard.html";
};

/* ================= ELEMENTS ================= */
const departmentSelect = document.getElementById("departmentSelect");
const semesterSelect   = document.getElementById("semesterSelect");
const subjectSelect    = document.getElementById("subjectSelect");
const notesList        = document.getElementById("notesList");
const chatBox          = document.getElementById("chatBox");
// const communityList = document.getElementById("communityList"); // unused

/* ================= PREDEFINED DATA ================= */
const data = {
  BCA: {
    1: ["C Programming", "Mathematics", "Digital Logic"],
    2: ["Data Structures", "OOP in C++", "Statistics"],
    3: ["Java", "DBMS", "Operating System"],
    4: ["Python", "Computer Networks", "Software Engineering"],
    5: ["Web Development", "AI Basics", "Cloud Computing"],
    6: ["Machine Learning", "Cyber Security", "Project"]
  },
  BBA: {
    1: ["Principles of Management", "Business Economics", "Accounting"],
    2: ["Marketing", "Business Law", "Statistics"],
    3: ["HR Management", "Financial Management", "Operations"],
    4: ["Entrepreneurship", "Organizational Behaviour", "Research Methods"],
    5: ["Strategic Management", "International Business", "Finance"],
    6: ["Project", "Business Ethics", "Viva"]
  },
  BCom: {
    1: ["Financial Accounting", "Business Law", "Economics"],
    2: ["Corporate Accounting", "Statistics", "Cost Accounting"],
    3: ["Income Tax", "Auditing", "Banking"],
    4: ["GST", "Management Accounting", "Business Finance"],
    5: ["Investment", "E-Commerce", "Entrepreneurship"],
    6: ["Project", "Viva", "Advanced Accounting"]
  },
  BSc: {
    1: ["Physics", "Chemistry", "Mathematics"],
    2: ["Electronics", "Statistics", "Programming"],
    3: ["Data Analysis", "Numerical Methods", "DBMS"],
    4: ["Computer Networks", "OS", "Python"],
    5: ["AI", "ML", "Cloud"],
    6: ["Project", "Cyber Security", "Viva"]
  },
  MCA: {
    1: ["Advanced Java", "DSA", "Mathematics"],
    2: ["DBMS", "OS", "Computer Networks"],
    3: ["Cloud Computing", "AI", "ML"],
    4: ["Big Data", "Cyber Security", "Project"]
  }
};

/* ================= LOAD DEPARTMENTS ================= */
if (departmentSelect) {
  departmentSelect.innerHTML = `<option value="">Select Department</option>`;
  Object.keys(data).forEach(dept => {
    departmentSelect.innerHTML += `<option value="${dept}">${dept}</option>`;
  });
}

/* ================= DEPARTMENT → SEMESTERS ================= */
departmentSelect?.addEventListener("change", () => {
  semesterSelect.innerHTML = `<option value="">Select Semester</option>`;
  subjectSelect.innerHTML  = `<option value="">Select Subject</option>`;
  notesList.innerHTML      = "";

  semesterSelect.disabled  = true;
  subjectSelect.disabled   = true;

  const dept = departmentSelect.value;
  if (!dept) return;

  Object.keys(data[dept]).forEach(sem => {
    semesterSelect.innerHTML += `<option value="${sem}">Semester ${sem}</option>`;
  });

  semesterSelect.disabled = false;
});

/* ================= SEMESTER → SUBJECTS ================= */
semesterSelect?.addEventListener("change", () => {
  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
  notesList.innerHTML     = "";
  subjectSelect.disabled  = true;

  const dept = departmentSelect.value;
  const sem  = semesterSelect.value;

  if (!sem) return;

  data[dept][sem].forEach(sub => {
    subjectSelect.innerHTML += `<option value="${sub}">${sub}</option>`;
  });

  subjectSelect.disabled = false;
});

/* ================= SUBJECT → LOAD NOTES (Supabase) ================= */
subjectSelect?.addEventListener("change", async () => {
  const subject = subjectSelect.value;
  notesList.innerHTML = "";

  if (!subject) return;

  try {
    const { data: notes, error } = await supabase
      .from("notes")
      .select("*")
      .eq("subject_name", subject)
      .order("created_at", { ascending: false });   // optional: newest first

    if (error) throw error;

    if (!notes || notes.length === 0) {
      notesList.innerHTML = "<li>No notes available yet.</li>";
      return;
    }

    notes.forEach(note => {
      const safeName = note.name.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      notesList.innerHTML += `
        <li>
          <a href="${note.url}" target="_blank" rel="noopener noreferrer">
            ${safeName}
          </a>
        </li>`;
    });
  } catch (err) {
    console.error("Failed to load notes:", err);
    notesList.innerHTML = "<li>Error loading notes</li>";
  }
});

/* ================= REQUEST COURSE → SEMESTERS ================= */
const requestCourse = document.getElementById("requestCourse");
const requestSemester = document.getElementById("requestSemester");

if (requestCourse) {
  requestCourse.innerHTML = `<option value="">Select Course</option>`;
  Object.keys(data).forEach(course => {
    requestCourse.innerHTML += `<option value="${course}">${course}</option>`;
  });
}

requestCourse?.addEventListener("change", () => {
  requestSemester.innerHTML = `<option value="">Select Semester</option>`;
  requestSemester.disabled = true;

  const course = requestCourse.value;
  if (!course) return;

  Object.keys(data[course]).forEach(sem => {
    requestSemester.innerHTML += `<option value="${sem}">Semester ${sem}</option>`;
  });

  requestSemester.disabled = false;
});

/* ================= UPLOAD NOTE (Supabase) ================= */
window.uploadNote = async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput?.files?.[0];
  const subject = subjectSelect?.value;

  if (!file) return alert("Please select a file first");
  if (!subject) return alert("Please select a subject first");

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const fileExt  = file.name.split('.').pop();
    const fileName = `${Date.now()}_${crypto.randomUUID?.() || Math.random().toString(36).slice(2)}.${fileExt}`;
    const filePath = `${subject}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("notes")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage.from("notes").getPublicUrl(filePath);

    const { error: dbError } = await supabase
      .from("pending_notes")
      .insert({
        name: file.name,
        url: urlData.publicUrl,
        subject_name: subject,
        uploaded_by: user.id,
        status: "pending",
        created_at: new Date().toISOString()
      });

    if (dbError) throw dbError;

    alert("Note uploaded and sent for teacher verification 🚀");
    fileInput.value = ""; // clear input

    // Optional: refresh notes list
    subjectSelect.dispatchEvent(new Event("change"));

  } catch (err) {
    console.error(err);
    alert("Upload failed: " + (err.message || "Unknown error"));
  }
};

/* ================= CHAT (Firebase version) ================= */
// IMPORTANT: Decide whether you're using Supabase **OR** Firebase — not both!

// If you're using **Firebase** for chat:
if (chatBox && typeof db !== "undefined" && typeof auth !== "undefined") {
  const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));

  onSnapshot(q, (snapshot) => {
    chatBox.innerHTML = "";
    snapshot.forEach(docSnap => {
      const msg = docSnap.data();
      const div = document.createElement("div");
      div.innerHTML = `
        <strong>${msg.senderName || "Anonymous"}</strong><br>
        <span style="color:#666; font-size:0.9em;">
          ${msg.createdAt?.toDate?.()?.toLocaleTimeString() || ""}
        </span>
        <p>${msg.text}</p>
      `;
      chatBox.appendChild(div);
    });
    chatBox.scrollTop = chatBox.scrollHeight;
  });
}

window.sendMessage = async () => {
  const msgInput = document.getElementById("msg");
  if (!msgInput?.value?.trim()) return;

  const currentUser = auth.currentUser;
  if (!currentUser) {
    alert("Please sign in to send messages");
    return;
  }

  try {
    const userSnap = await getDoc(doc(db, "users", currentUser.uid));
    const senderName = userSnap.exists() ? (userSnap.data().name || "User") : "User";

    const messageData = {
      text: msgInput.value.trim(),
      senderId: currentUser.uid,
      senderName,
      createdAt: serverTimestamp()   // better than new Date()
    };

    // For now — global chat only (private chat logic removed for clarity)
    await addDoc(collection(db, "messages"), messageData);

    msgInput.value = "";
  } catch (err) {
    console.error("Send message failed:", err);
    alert("Failed to send message");
  }
};


/* ================= FILE UPLOAD ================= */

window.uploadFile = async () => {
  const fileInput = document.getElementById("fileInput");
  const file = fileInput?.files[0];
  if (!file) return alert("Select a file");

  const user = auth.currentUser;
  if (!user) return;

  const storageRef = ref(storage, `uploads/${Date.now()}_${file.name}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);

  await addDoc(collection(db, "uploads"), {
    name: file.name,
    url,
    uploadedBy: user.uid,
    status: "pending",
    createdAt: new Date()
  });

  alert("Uploaded 🚀");
};



/* ================= APPROVAL LIST ================= */

const approvalList = document.getElementById("approvalList");

if (approvalList) {
  const q = query(collection(db, "uploads"));

  onSnapshot(q, snapshot => {
    approvalList.innerHTML = "";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();

      if (data.status === "pending") {
        const li = document.createElement("li");

        li.innerHTML = `
          ${data.name}
          <button>Approve</button>
        `;

        li.querySelector("button").addEventListener("click", () => {
          approve(docSnap.id);
        });

        approvalList.appendChild(li);
      }
    });
  });
}

/* ================= PENDING NOTES LIST ================= */

const pendingNotesList = document.getElementById("pendingNotesList");

async function loadPendingNotes() {
  if (!pendingNotesList) return;

  try {
    const { data: notes, error } = await supabase
      .from("pending_notes")
      .select("*")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    pendingNotesList.innerHTML = "";

    notes.forEach(note => {
      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <strong>${note.name}</strong><br>
          <small>Subject: ${note.subject_name} | By: ${note.uploaded_by}</small>
        </div>
        <div>
          <button onclick="approveNote('${note.id}')">Approve</button>
          <button onclick="rejectNote('${note.id}')" style="background: #dc2626;">Reject</button>
        </div>
      `;
      pendingNotesList.appendChild(li);
    });
  } catch (err) {
    console.error("Failed to load pending notes:", err);
    pendingNotesList.innerHTML = "<li>Error loading pending notes</li>";
  }
}

/* ================= STATS (SAFE VERSION) ================= */

const statsBox = document.getElementById("stats");

if (statsBox) {
  onSnapshot(collection(db, "uploads"), snapshot => {
    let pending = 0;
    let approved = 0;

    snapshot.forEach(doc => {
      if (doc.data().status === "pending") pending++;
      if (doc.data().status === "approved") approved++;
    });

    statsBox.innerHTML = `
      <p>Pending: ${pending}</p>
      <p>Approved: ${approved}</p>
    `;
  });
}

/* ================= USER SEARCH ================= */

const searchInput = document.getElementById("userSearch");
const searchResults = document.getElementById("searchResults");

if (searchInput && searchResults) {
  searchInput.addEventListener("input", async () => {

    const value = searchInput.value.trim().toLowerCase();
    searchResults.innerHTML = "";

    if (!value) return;

    const snapshot = await getDocs(collection(db, "users"));
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    snapshot.forEach(docSnap => {
      const data = docSnap.data();

      if (
        data.name &&
        data.name.toLowerCase().includes(value) &&
        docSnap.id !== currentUser.uid
      ) {
        const li = document.createElement("li");
        li.textContent = data.name;

        li.addEventListener("click", () => {
          selectUser(docSnap.id, data.name);
        });

        searchResults.appendChild(li);
      }
    });
  });
}

/* ================= SELECT USER ================= */

function selectUser(userId, name) {
  selectedUserId = userId;

  const searchInput = document.getElementById("userSearch");
  const searchResults = document.getElementById("searchResults");

  if (searchInput) searchInput.value = name;
  if (searchResults) searchResults.innerHTML = "";

  loadPrivateChat();
}

function loadPrivateChat() {

  if (!selectedUserId) return;

  const chatBox = document.getElementById("chatBox");
  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const chatId = [currentUser.uid, selectedUserId].sort().join("_");

  if (unsubscribeChat) unsubscribeChat();

  const q = query(
    collection(db, "privateChats", chatId, "messages"),
    orderBy("createdAt")
  );

  unsubscribeChat = onSnapshot(q, snapshot => {
    chatBox.innerHTML = "";

    snapshot.forEach(docSnap => {
      const data = docSnap.data();

      const div = document.createElement("div");
      div.className = "chat-message";
      div.innerHTML = `
        <strong>${data.senderName}</strong>
        <p>${data.text}</p>
      `;

      chatBox.appendChild(div);
    });

    chatBox.scrollTop = chatBox.scrollHeight;
  });
}
window.sendMessage = async () => {

  const msgInput = document.getElementById("msg");
  if (!msgInput.value.trim()) return;

  const currentUser = auth.currentUser;
  if (!currentUser) return;

  const userSnap = await getDoc(doc(db, "users", currentUser.uid));
  const senderName = userSnap.exists() && userSnap.data().name
    ? userSnap.data().name
    : "Anonymous";

  if (!selectedUserId) {
    // Send global message
    await addDoc(collection(db, "messages"), {
      text: msgInput.value.trim(),
      senderId: currentUser.uid,
      senderName,
      createdAt: new Date()
    });
  } else {
    // Send private message
    const chatId = [currentUser.uid, selectedUserId].sort().join("_");

    await addDoc(
      collection(db, "privateChats", chatId, "messages"),
      {
        text: msgInput.value.trim(),
        senderId: currentUser.uid,
        senderName,
        createdAt: new Date()
      }
    );
  }

  msgInput.value = "";
};
auth.onAuthStateChanged(async (user) => {
  if (!user) return;

  const chatBox = document.getElementById("chatBox");

  // Load global chat only if no private chat selected
  if (chatBox && !selectedUserId) {
    const q = query(collection(db, "messages"), orderBy("createdAt"));

    onSnapshot(q, (snapshot) => {
      chatBox.innerHTML = "";

      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        chatBox.innerHTML += `
          <div class="chat-message">
            <strong>${data.senderName}</strong>
            <p>${data.text}</p>
          </div>
        `;
      });

      chatBox.scrollTop = chatBox.scrollHeight;
    });
  }
});
window.approve = async (id) => {
  await setDoc(doc(db, "uploads", id), {
    status: "approved"
  }, { merge: true });

  alert("Approved ✅");
};

window.approveNote = async (id) => {
  try {
    // Get the pending note
    const { data: note, error: fetchError } = await supabase
      .from("pending_notes")
      .select("*")
      .eq("id", id)
      .single();

    if (fetchError) throw fetchError;

    // Insert into notes
    const { error: insertError } = await supabase
      .from("notes")
      .insert({
        name: note.name,
        url: note.url,
        subject_name: note.subject_name,
        uploaded_by: note.uploaded_by,
        created_at: note.created_at
      });

    if (insertError) throw insertError;

    // Delete from pending_notes
    const { error: deleteError } = await supabase
      .from("pending_notes")
      .delete()
      .eq("id", id);

    if (deleteError) throw deleteError;

    alert("Note approved ✅");
    loadPendingNotes(); // Refresh the list
  } catch (err) {
    console.error("Approve note failed:", err);
    alert("Failed to approve note");
  }
};

window.rejectNote = async (id) => {
  try {
    const { error } = await supabase
      .from("pending_notes")
      .delete()
      .eq("id", id);

    if (error) throw error;

    alert("Note rejected");
    loadPendingNotes(); // Refresh the list
  } catch (err) {
    console.error("Reject note failed:", err);
    alert("Failed to reject note");
  }
};
document.addEventListener("DOMContentLoaded", () => {

  const openBtn = document.getElementById("openProjectFormBtn");
  const form = document.getElementById("projectForm");
  const sendBtn = document.getElementById("sendProjectBtn");

  if (openBtn && form) {
    openBtn.addEventListener("click", () => {
      form.style.display =
        form.style.display === "none" ? "block" : "none";
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", postProjectToChat);
  }

  loadPendingNotes();
  loadLiveSessions();
});

window.runAIVerifier = () => {
  alert("AI Verifier: Checking content for plagiarism and quality...");
};

window.runTeacherVerifier = () => {
  alert("Teacher Verifier: Manual review initiated...");
};

window.reviewProjects = () => {
  alert("Projects Reviews: Reviewing submitted projects...");
};

window.provideAssignmentSolution = () => {
  alert("Assignment Solution: Providing solutions and feedback...");
};

window.startLiveSession = async () => {
  const user = auth.currentUser;
  if (!user) return alert("Login first");

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const teacherName = userSnap.data()?.name || "Teacher";

  await addDoc(collection(db, "live_sessions"), {
    teacherId: user.uid,
    teacherName,
    status: "active",
    startedAt: new Date()
  });

  const statusDiv = document.getElementById("liveSessionStatus");
  if (statusDiv) {
    statusDiv.style.display = "block";
  }
  alert("Live doubt clearing session started! Students can now join.");
};

window.joinLiveSession = (sessionId, teacherId) => {
  const options = {
    key: 'rzp_test_your_key', // Replace with your Razorpay key
    amount: 5000, // ₹50 in paise
    currency: 'INR',
    name: 'Live Doubt Session',
    description: 'Join live doubt clearing session',
    handler: function (response) {
      alert('Payment successful! Joining session...');
      // Here you can add logic to actually join the video call
    },
    prefill: {
      email: auth.currentUser?.email || '',
    },
    theme: {
      color: '#3399cc'
    }
  };
  const rzp = new Razorpay(options);
  rzp.open();
};
async function postProjectToChat() {
  const user = auth.currentUser;
  if (!user) return alert("Login first");

  const name = document.getElementById("projectName").value.trim();
  const desc = document.getElementById("projectDesc").value.trim();
  const contact = document.getElementById("projectContact").value.trim();

  if (!name || !desc || !contact) {
    return alert("Fill all fields");
  }

  const userSnap = await getDoc(doc(db, "users", user.uid));
  const senderName = userSnap.data()?.name || "User";

  const formattedMessage = `
🚀 PROJECT COLLABORATION

📌 Project: ${name}
📝 Description: ${desc}
📞 Contact: ${contact}

Reply here if interested!
`;

  await addDoc(collection(db, "messages"), {
    text: formattedMessage,
    senderName,
    senderId: user.uid,
    type: "project",
    createdAt: new Date()
  });

  document.getElementById("projectName").value = "";
  document.getElementById("projectDesc").value = "";
  document.getElementById("projectContact").value = "";

  alert("Project posted in chat 🚀");
}
async function createCommunity() {

  const user = auth.currentUser;
  if (!user) return alert("Login first");

  const nameInput = document.getElementById("communityName");
  const descInput = document.getElementById("communityDesc");
  const btn = document.getElementById("createCommunityBtn");

  if (!nameInput || !descInput || !btn) return;

  const name = nameInput.value.trim();
  const desc = descInput.value.trim();

  if (!name || !desc) {
    return alert("Fill all fields");
  }

  // Prevent duplicate names
  const existing = await getDocs(
    query(collection(db, "communities"))
  );

  let duplicate = false;
  existing.forEach(docSnap => {
    if (docSnap.data().name.toLowerCase() === name.toLowerCase()) {
      duplicate = true;
    }
  });

  if (duplicate) {
    return alert("Community with this name already exists");
  }

  const confirmPayment = confirm("Pay ₹500 to create this premium community?");
  if (!confirmPayment) return;

  btn.disabled = true;
  btn.innerText = "Processing Payment...";

  setTimeout(async () => {

    const userSnap = await getDoc(doc(db, "users", user.uid));
    const creatorName = userSnap.data()?.name || "User";

    await addDoc(collection(db, "communities"), {
      name,
      description: desc,
      creatorId: user.uid,
      creatorName,
      members: [user.uid],
      paymentId: "DEMO_" + Date.now(),
      createdAt: new Date()
    });

    nameInput.value = "";
    descInput.value = "";

    btn.disabled = false;
    btn.innerText = "Pay ₹500 & Create";

    alert("🎉 Community Created Successfully!");

  }, 1200);
}
function loadCommunities() {

  const communityList = document.getElementById("communityList");
  if (!communityList) return;

  onSnapshot(collection(db, "communities"), snapshot => {

    communityList.innerHTML = "";

    if (snapshot.empty) {
      communityList.innerHTML = "<p>No communities yet.</p>";
      return;
    }

    snapshot.forEach(docSnap => {

      const data = docSnap.data();
      const user = auth.currentUser;

      const card = document.createElement("div");
      card.className = "community-card";

      const isJoined = user && data.members?.includes(user.uid);

      card.innerHTML = `
        <div class="community-title">
          ${data.name}
          <span class="premium-badge">Premium</span>
        </div>

        <div class="community-desc">
          ${data.description}
        </div>

        <div class="community-meta">
          👥 ${data.members?.length || 0} Members
        </div>
      `;

      const joinBtn = document.createElement("button");

      joinBtn.textContent = isJoined ? "Joined" : "Join";
      joinBtn.disabled = isJoined;

      joinBtn.addEventListener("click", async () => {

        if (!user) return alert("Login first");

        await setDoc(
          doc(db, "communities", docSnap.id),
          {
            members: [...(data.members || []), user.uid]
          },
          { merge: true }
        );
      });

      card.appendChild(joinBtn);
      communityList.appendChild(card);
    });
  });
}
document.addEventListener("DOMContentLoaded", () => {

  document.getElementById("createCommunityBtn")
    ?.addEventListener("click", createCommunity);

  document.getElementById("requestSessionBtn")
    ?.addEventListener("click", requestSession);

  loadCommunities();
  loadAcceptedSessions();
  loadSessionRequests();
});

/* ================= REQUEST LIVE SESSION ================= */
window.requestSession = async () => {
  const course = requestCourse?.value;
  const semester = requestSemester?.value;

  if (!course || !semester) {
    alert("Please select course and semester.");
    return;
  }

  // Fake payment
  alert("Payment of ₹50 successful! Requesting session...");

  const user = auth.currentUser;
  if (!user) return;

  // Find teacher for the course
  const teachersQuery = query(collection(db, "users"), where("role", "==", "teacher"), where("course", "==", course));
  const teachersSnap = await getDocs(teachersQuery);

  if (teachersSnap.empty) {
    alert("No teacher available for this course.");
    return;
  }

  const teacherId = teachersSnap.docs[0].id; // Take first teacher

  await addDoc(collection(db, "session_requests"), {
    studentId: user.uid,
    course,
    semester,
    teacherId,
    status: "pending",
    requestedAt: new Date()
  });

  alert("Session request sent to teacher!");
};

/* ================= LOAD SESSION REQUESTS (TEACHER) ================= */
async function loadSessionRequests() {
  const list = document.getElementById("sessionRequestsList");
  if (!list) return;

  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "session_requests"), where("teacherId", "==", user.uid), where("status", "==", "pending"));

  onSnapshot(q, (snapshot) => {
    list.innerHTML = "";
    snapshot.forEach(async (docSnap) => {
      const data = docSnap.data();
      const studentSnap = await getDoc(doc(db, "users", data.studentId));
      const studentName = studentSnap.exists() ? studentSnap.data().name : "Unknown";

      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <strong>${studentName}</strong><br>
          Course: ${data.course}, Semester: ${data.semester}
        </div>
        <button onclick="acceptRequest('${docSnap.id}')">Accept</button>
      `;
      list.appendChild(li);
    });
  });
}

/* ================= ACCEPT SESSION REQUEST ================= */
window.acceptRequest = async (requestId) => {
  // Generate fake meet link
  const meetLink = `https://meet.google.com/${Math.random().toString(36).substring(2, 15)}`;

  await setDoc(doc(db, "session_requests", requestId), {
    status: "accepted",
    meetLink,
    acceptedAt: new Date()
  }, { merge: true });

  alert("Session accepted! Meet link generated.");
};

/* ================= LOAD ACCEPTED SESSIONS (STUDENT) ================= */
function loadAcceptedSessions() {
  const list = document.getElementById("acceptedSessionsList");
  if (!list) return;

  const user = auth.currentUser;
  if (!user) return;

  const q = query(collection(db, "session_requests"), where("studentId", "==", user.uid), where("status", "==", "accepted"));

  onSnapshot(q, (snapshot) => {
    list.innerHTML = "";
    snapshot.forEach(async (docSnap) => {
      const data = docSnap.data();
      const teacherSnap = await getDoc(doc(db, "users", data.teacherId));
      const teacherName = teacherSnap.exists() ? teacherSnap.data().name : "Teacher";

      const li = document.createElement("li");
      li.innerHTML = `
        <div>
          <strong>${teacherName}</strong><br>
          Course: ${data.course}, Semester: ${data.semester}
        </div>
        <a href="${data.meetLink}" target="_blank">Join Meet</a>
      `;
      list.appendChild(li);
    });
  });
}
