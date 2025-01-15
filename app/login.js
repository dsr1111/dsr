// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB687ow_NvAJxJdLaSfke6hOalFujAeJ50",
  authDomain: "dsr1-59d0e.firebaseapp.com",
  projectId: "dsr1-59d0e",
  storageBucket: "dsr1-59d0e.firebasestorage.app",
  messagingSenderId: "393673268086",
  appId: "1:393673268086:web:42409e7320c0ad4d99f857",
  measurementId: "G-V5VLCXSKM7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
const db = getFirestore(app);

// 회원가입 로직
document.getElementById('signup-submit').addEventListener('click', async (event) => {
  event.preventDefault();

  const emailDomain = "@123.123";
  const signupemail = document.getElementById('signup-email').value.trim();
  const signuppassword = document.getElementById('signup-password').value;

  const fullEmail = signupemail.includes('@') ? signupemail : signupemail + emailDomain;

  try {
    // Firebase Authentication에 사용자 등록
    const userCredential = await createUserWithEmailAndPassword(auth, fullEmail, signuppassword);
    const user = userCredential.user;

    // Firestore에 사용자 정보 추가
    await setDoc(doc(db, "users", user.uid), {
      email: fullEmail,
      isApproved: false // 기본적으로 승인 대기 상태
    });

    alert("회원가입이 완료되었습니다. 관리자의 승인을 기다리세요.");
    document.getElementById('signup-modal').style.display = 'none';
  } catch (error) {
    alert(`회원가입 실패: ${error.message}`);
  }
});

// 로그인 로직
document.getElementById('btn').addEventListener('click', async (event) => {
  event.preventDefault();

  const emailDomain = "@123.123";
  const email = document.getElementById('id').value.trim();
  const password = document.getElementById('pw').value;

  const fullEmail = email.includes('@') ? email : email + emailDomain;

  // 장치 식별자를 생성합니다.
  const deviceId = navigator.userAgent + Math.random().toString(36).substr(2, 9);

  try {
    // Firebase Authentication으로 로그인 처리
    const userCredential = await signInWithEmailAndPassword(auth, fullEmail, password);
    const user = userCredential.user;

    // Firestore에서 승인 상태 확인
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().isApproved) {
      const now = new Date();
      const koreaTime = new Date(now.getTime() + 9 * 60 * 60 * 1000); // 한국 시간 변환
      const loginTime = koreaTime.toISOString().replace('T', ' ').split('.')[0]; 

      // Firestore에 로그인 시간 및 장치 식별자 저장
      await setDoc(userDocRef, { 
        lastLogin: loginTime, 
        deviceId: deviceId 
      }, { merge: true });

      // Firestore에서 실시간으로 로그아웃 감지
      onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists() && docSnapshot.data().deviceId !== deviceId) {
          alert("다른 장치에서 로그인되었습니다. 현재 장치가 로그아웃됩니다.");
          auth.signOut();
          window.location.href = 'login.html'; // 로그인 페이지로 이동
        }
      });

      // 메인 페이지로 이동
      window.location.href = 'main.html';
    } else {
      alert("관리자의 승인을 기다려야 로그인할 수 있습니다.");
      auth.signOut(); // 로그아웃 처리
    }
  } catch (error) {
    alert("아이디 또는 비밀번호를 다시 확인해 주세요.");
  }
});

  

// 경고 표시 (빈 필드 확인)
let id = $('#id');
let pw = $('#pw');
let btn = $('#btn');

$(btn).on('click', function() {
  if($(id).val() == "") {
    $(id).next('label').addClass('warning');
    setTimeout(function() {
      $('label').removeClass('warning');
    },1500);
  }
  else if($(pw).val() == "") {
    $(pw).next('label').addClass('warning');
    setTimeout(function() {
      $('label').removeClass('warning');
    },1500);
  }
});

// 회원가입 모달 열고 닫기
document.getElementById('signup-link').addEventListener('click', function (event) {
  event.preventDefault();
  document.getElementById('signup-modal').style.display = 'flex';
});

document.getElementById('close-btn').addEventListener('click', function () {
  document.getElementById('signup-modal').style.display = 'none';
});
