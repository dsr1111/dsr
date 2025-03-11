document.addEventListener("DOMContentLoaded", async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    const postId = localStorage.getItem("editPostId"); // ✅ ID만 저장, 내용을 저장하지 않음

    if (mode === "edit" && postId) {
        try {
            // 🔹 서버에서 기존 게시글 데이터 불러오기
            const response = await fetch(`https://dsr-xo3w.onrender.com/posts/${postId}`);
            if (!response.ok) throw new Error("게시글을 불러올 수 없습니다.");
            
            const post = await response.json();

            // 🔹 불러온 데이터 입력창에 채우기
            document.getElementById("title").value = post.title;
            document.getElementById("author").value = post.author;
            document.getElementById("password").value = ""; // 🔹 보안상 비밀번호는 다시 입력받음

            // ✅ Quill 에디터가 로드된 후 내용 삽입 보장
            setTimeout(() => {
                quill.root.innerHTML = post.content; // Quill 에디터에 내용 삽입
                console.log("✅ Quill 에디터에 기존 내용 삽입 완료");
            }, 500);

            // ✅ "수정" 버튼 설정 (기존 `createPost` 제거 후 `updatePost` 실행)
            const submitBtn = document.getElementById("submit-btn");
            submitBtn.innerText = "수정";
            submitBtn.removeEventListener("click", createPost); // 중복 방지
            submitBtn.addEventListener("click", async () => {
                await updatePost(postId); // 게시글 수정 함수 실행
            });

        } catch (error) {
            console.error("❌ 게시글 불러오기 오류:", error);
            alert("게시글을 불러오는 중 오류가 발생했습니다.");
            window.location.href = "tip.html";
        }
    } else {
        // 새 글 작성 모드에서는 기존의 글 작성 기능을 연결
        document.getElementById("submit-btn").addEventListener("click", createPost);
    }
});


async function updatePost() {
    const postId = localStorage.getItem("editPostId");
    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();
    const password = document.getElementById("password").value.trim();
    const content = quill.root.innerHTML; // ✅ Quill 에디터에서 데이터 가져오기

    if (!title || !content || !password) {
        alert("제목, 내용, 비밀번호를 입력해주세요.");
        return;
    }

    try {
        const response = await fetch(`https://dsr-xo3w.onrender.com/posts/${postId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content, author, password }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        alert("게시글이 수정되었습니다.");

        // ✅ localStorage에서 postId 삭제
        localStorage.removeItem("editPostId");

        window.location.href = `post.html?id=${postId}`;
    } catch (error) {
        console.error("❌ 게시글 수정 오류:", error);
        alert(error.message || "게시글 수정 중 오류가 발생했습니다.");
    }
}

