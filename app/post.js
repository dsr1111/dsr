const API_URL = "https://port-0-dsrwiki-m80cp0gz93b75d52.sel4.cloudtype.app/posts";
const urlParams = new URLSearchParams(window.location.search);
const postId = urlParams.get("id");

async function fetchPost() {
    if (!postId) {
        alert("잘못된 접근입니다.");
        window.location.href = "tip.html";
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${postId}`);

        if (!response.ok) {
            throw new Error("게시글을 찾을 수 없습니다.");
        }

        const post = await response.json();

        // 🔹 게시글 제목, 작성자, 작성일 업데이트
        document.getElementById("post-title").innerText = post.title;
        document.getElementById("post-author").innerText = `${post.author || "익명"}`;
        document.getElementById("post-date").innerText = `${new Date(post.createdAt).toLocaleString("ko-KR", {
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: false
        })}`;

        // 🔹 게시글 내용 업데이트 (스타일 변경 없이 원본 그대로 유지)
        document.getElementById("post-content").innerHTML = post.content;

        // 🔹 댓글 불러오기
        fetchComments();
    } catch (error) {
        console.error("❌ 게시글 불러오기 오류:", error);
        alert("게시글을 불러오는 중 오류가 발생했습니다.");
        window.location.href = "tip.html";
    }
}

// 📌 게시글 삭제하기
async function deletePost() {
    const password = document.getElementById("post-password").value.trim();
    if (!password) {
        alert("비밀번호를 입력하세요!");
        return;
    }

    if (!confirm("정말 삭제하시겠습니까?")) return;

    try {
        const response = await fetch(`${API_URL}/${postId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        alert(result.message);
        window.location.href = "tip.html"; // 삭제 후 목록으로 이동

    } catch (error) {
        console.error("❌ 게시글 삭제 오류:", error);
        alert(error.message || "게시글 삭제 중 오류가 발생했습니다.");
    }
}

// 📌 게시글 수정 기능 (수정 모드 활성화)
function enableEditMode() {
    const postTitle = document.getElementById("post-title");
    const postContent = document.getElementById("post-content");
    const editButton = document.getElementById("edit-post");

    // 🔹 제목과 내용을 수정할 수 있도록 변경
    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.id = "edit-title";
    titleInput.value = postTitle.innerText;

    const contentTextarea = document.createElement("textarea");
    contentTextarea.id = "edit-content";
    contentTextarea.value = postContent.innerHTML;

    // 🔹 기존 요소 대체
    postTitle.replaceWith(titleInput);
    postContent.replaceWith(contentTextarea);

    // 🔹 버튼 텍스트 변경
    editButton.innerText = "저장";
    editButton.onclick = updatePost;
}

// 📌 게시글 수정 요청 (서버 업데이트)
async function updatePost() {
    const title = document.getElementById("edit-title").value.trim();
    const content = document.getElementById("edit-content").value.trim();
    const password = document.getElementById("post-password").value.trim();

    if (!title || !content || !password) {
        alert("제목, 내용, 비밀번호를 입력하세요!");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${postId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, content, password }),
        });

        const result = await response.json();
        if (!response.ok) throw new Error(result.message);

        alert("게시글이 수정되었습니다!");
        window.location.reload(); // 새로고침하여 수정된 내용 반영

    } catch (error) {
        console.error("❌ 게시글 수정 오류:", error);
        alert(error.message || "게시글 수정 중 오류가 발생했습니다.");
    }
}


function updateCommentCount(count) {
    const commentCountElement = document.getElementById("comment-count");
    if (commentCountElement) {
        commentCountElement.innerText = `${count}개`;
    }
}

// 📌 댓글 불러오기
async function fetchComments() {
    try {
        const response = await fetch(`${API_URL}/${postId}`);
        if (!response.ok) throw new Error("댓글을 불러올 수 없습니다.");

        const post = await response.json();
        const comments = post.comments || [];

        const commentsContainer = document.getElementById("comments-container");
        commentsContainer.innerHTML = "";

        // 🔹 댓글 개수 업데이트
        updateCommentCount(comments.length);

        comments.forEach(comment => {
            const commentDiv = document.createElement("div");
            commentDiv.classList.add("comment-item");
            commentDiv.innerHTML = `
                <div class="comment-meta">
                    <span class="comment-author">${comment.author}</span>
                    <p class="comment-content">${comment.content}</p>
                </div>
                <div>
                    <span class="comment-date">${new Date(comment.createdAt).toLocaleString("ko-KR", {
                        year: "2-digit",
                        month: "2-digit",
                        day: "2-digit",
                        hour: "2-digit",
                        minute: "2-digit",
                        second: "2-digit",
                        hour12: false
                    })}</span>
                    <button class="delete-comment" onclick="deleteComment('${postId}', '${comment._id}')">✖</button>
                </div>
            `;
            commentsContainer.appendChild(commentDiv);
        });

    } catch (error) {
        console.error("❌ 댓글 불러오기 실패:", error);
    }
}

// 📌 댓글 작성하기 (POST 요청)
async function submitComment() {
    const author = document.getElementById("comment-author").value.trim();
    const password = document.getElementById("comment-password").value.trim(); // 🔹 비밀번호 추가
    const content = document.getElementById("comment-content").value.trim();

    if (!author || !content || !password) {
        alert("닉네임, 비밀번호, 댓글 내용을 입력하세요!");
        return;
    }

    // 🔹 현재 시간을 ISO 형식으로 추가
    const createdAt = new Date().toISOString();

    try {
        const response = await fetch(`${API_URL}/${postId}/comments`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ author, password, content, createdAt }), // 🔹 비밀번호 포함
        });

        if (!response.ok) throw new Error("댓글 작성 실패");
        document.getElementById("comment-author").value = "";
        document.getElementById("comment-password").value = ""; // 🔹 입력값 초기화
        document.getElementById("comment-content").value = "";

        fetchComments(); // 🔹 댓글 목록 갱신
    } catch (error) {
        console.error("❌ 댓글 작성 오류:", error);
        alert("댓글 작성 중 문제가 발생했습니다.");
    }
}

// 📌 댓글 삭제하기 (비밀번호 체크 포함)
// 📌 댓글 삭제하기 (DELETE 요청)
async function deleteComment(postId, commentId) {
    if (!commentId) {
        console.error("❌ 오류: 댓글 ID가 없습니다.");
        return;
    }

    const password = prompt("댓글을 삭제하려면 비밀번호를 입력하세요:");
    if (!password) {
        alert("비밀번호를 입력해야 삭제할 수 있습니다.");
        return;
    }

    try {
        const response = await fetch(`${API_URL}/${postId}/comments/${commentId}`, {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }), // 🔹 비밀번호 전달
        });

        const result = await response.json();
        if (!response.ok) {
            throw new Error(result.message);
        }

        alert(result.message);
        fetchComments(); // 🔹 삭제 후 댓글 목록 갱신
    } catch (error) {
        console.error("❌ 댓글 삭제 오류:", error);
        alert(error.message || "댓글 삭제 중 오류가 발생했습니다.");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    if (postId) {
        fetchPost(); // 🔹 게시글 데이터 불러오기
        fetchComments(); // 🔹 댓글 데이터 불러오기
    } else {
        alert("잘못된 접근입니다.");
        window.location.href = "tip.html";
    }

    document.getElementById("delete-post").addEventListener("click", deletePost);
    document.getElementById("edit-post").addEventListener("click", enableEditMode);

    const submitCommentBtn = document.getElementById("submit-comment");
    if (submitCommentBtn) {
        submitCommentBtn.addEventListener("click", submitComment);
    }
});
