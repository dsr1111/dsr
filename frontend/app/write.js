document.addEventListener("DOMContentLoaded", () => {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get("mode");
    const postId = urlParams.get("id");

    if (mode === "edit" && postId) {
        document.getElementById("title").value = decodeURIComponent(urlParams.get("title") || "");
        document.getElementById("author").value = decodeURIComponent(urlParams.get("author") || "");
        document.getElementById("password").value = decodeURIComponent(urlParams.get("password") || "");

        // ✅ localStorage에서 content 불러오기 (없으면 빈 문자열)
        const postContent = localStorage.getItem("editPostContent") || "";

        // ✅ Quill 에디터가 로드된 후 내용 삽입 보장
        setTimeout(() => {
            quill.clipboard.dangerouslyPasteHTML(0, postContent);
            console.log("✅ Quill 에디터에 기존 내용 삽입 완료");
        }, 500);
;
        const submitBtn = document.getElementById("submit-btn");
        submitBtn.innerText = "수정";
        submitBtn.removeEventListener("click", createPost); // 중복 방지
        submitBtn.addEventListener("click", async () => {
            await updatePost(postId); // 게시글 수정 함수 실행
        });
    } else {
        document.getElementById("submit-btn").addEventListener("click", createPost);
    }
});

async function updatePost(postId) {
    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim();
    const password = document.getElementById("password").value.trim();
    const content = quill.root.innerHTML; // ✅ Quill에서 HTML 가져오기

    if (!title || !content || !password) {
        alert("제목, 내용, 비밀번호를 입력해주세요.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${postId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content, author, password }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        alert("게시글이 수정되었습니다.");

        // ✅ localStorage에서 내용 삭제
        localStorage.removeItem("editPostContent");

        window.location.href = `post.html?id=${postId}`;
    } catch (error) {
        console.error("❌ 게시글 수정 오류:", error);
        alert(error.message || "게시글 수정 중 오류가 발생했습니다.");
    }
}
