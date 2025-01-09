// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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

import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-auth.js";

const auth = getAuth();

document.getElementById('signup-submit').addEventListener('click', (event) => {
    event.preventDefault();

    const emailDomain = "@123.123";
    const signupemail = document.getElementById('signup-email').value.trim();
    const signuppassword = document.getElementById('signup-password').value;

    // 이메일 도메인 중복 확인 및 추가
    const fullEmail = signupemail.includes('@') ? signupemail : signupemail + emailDomain;

    // Firebase 회원가입
    createUserWithEmailAndPassword(auth, fullEmail, signuppassword)
        .then((userCredential) => {
            // 회원가입 성공
            const user = userCredential.user;
            alert("회원가입이 완료되었습니다.");
            document.getElementById('signup-modal').style.display = 'none';
        })
        .catch((error) => {
            // 회원가입 실패 처리
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(`회원가입 실패: ${errorMessage}`);
        });
});


document.getElementById('btn').addEventListener('click', (event) => {
    event.preventDefault()
    const emailDomain = "@123.123";
    const email = document.getElementById('id').value.trim();
    const password = document.getElementById('pw').value

    const fullEmail = email.includes('@') ? email : email + emailDomain;

    signInWithEmailAndPassword(auth, fullEmail, password)
        .then((userCredential) => {
            // Signed in 
            const user = userCredential.user;
            window.location.href = 'main.html';
        })
        .catch((error) => {
            const errorCode = error.code;
            const errorMessage = error.message;
            alert(`아이디, 비밀번호를 다시 확인해 주세요.`);
        });
})


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

document.getElementById('signup-link').addEventListener('click', function (event) {
    event.preventDefault();
    document.getElementById('signup-modal').style.display = 'flex';
});

document.getElementById('close-btn').addEventListener('click', function () {
    document.getElementById('signup-modal').style.display = 'none';
});