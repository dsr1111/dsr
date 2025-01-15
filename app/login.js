// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

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
      isApproved: false, // 기본적으로 승인 대기 상태
      activeSession: null // 활성 세션 초기화
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

  try {
    // Firebase Authentication으로 로그인
    const userCredential = await signInWithEmailAndPassword(auth, fullEmail, password);
    const user = userCredential.user;

    // Firestore에서 승인 상태 및 활성 세션 확인
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    if (userDoc.exists() && userDoc.data().isApproved) {
      // 기존 활성 세션이 있으면 로그아웃 처리
      const activeSession = userDoc.data().activeSession;
      if (activeSession && activeSession !== user.stsTokenManager.refreshToken) {
        try {
          await signOut(auth);
        } catch (error) {
          console.error("기존 세션 로그아웃 실패:", error);
        }
      }

      // Firestore에 새로운 세션 저장
      await updateDoc(userDocRef, {
        activeSession: user.stsTokenManager.refreshToken
      });

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
