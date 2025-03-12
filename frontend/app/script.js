const API_URL = "https://port-0-dsr-m85aqy8qfc2589fd.sel4.cloudtype.app/posts";
const postsPerPage = 15;
let currentPage = localStorage.getItem("currentPage") ? parseInt(localStorage.getItem("currentPage")) : 1;

// 📌 Quill 에디터 색상 문제 해결
Quill.register('formats/color', Quill.import('attributors/style/color'), true);
Quill.register('formats/background', Quill.import('attributors/style/background'), true);

// ✅ Quill Image Resize 모듈이 존재할 때만 등록
if (window.ImageResize) {
    Quill.register("modules/imageResize", window.ImageResize);
} else {
    console.warn("⚠️ Quill Image Resize 모듈이 로드되지 않았습니다.");
}

// 📌 Quill 에디터 초기화 (글 작성 페이지에서만 실행)
const editorElement = document.getElementById("editor");
if (editorElement) {
    window.quill = new Quill("#editor", {
        theme: "snow",
        modules: {
            toolbar: [
                [{ 'header': [1, 2, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'align': [] }],
                ['blockquote', 'code-block'],
                ['image', 'link'],
                ['clean']
            ],
            imageResize: true // ✅ 이미지 크기 조절 기능 활성화
        }
    });

    // 📌 Quill 에디터 내 이미지 업로드 기능 추가
    window.quill.getModule("toolbar").addHandler("image", () => {
        const input = document.createElement("input");
        input.setAttribute("type", "file");
        input.setAttribute("accept", "image/*");
        input.click();

        input.addEventListener("change", async () => {
            const file = input.files[0];

            if (file) {
                console.log("📌 선택된 파일:", file); // ✅ 업로드할 파일 정보 확인

                const formData = new FormData();
                formData.append("image", file);

                try {
                    // 📌 서버에 이미지 업로드
                    const response = await fetch("https://port-0-dsr-m85aqy8qfc2589fd.sel4.cloudtype.app/upload", {
                        method: "POST",
                        body: formData,
                        headers: { "Accept": "application/json" },
                        mode: "cors",  // ✅ CORS 모드 추가
                    });

                    const result = await response.json();
                    console.log("📌 서버 응답:", result); // ✅ 서버 응답 확인

                    if (result.success) {
                        // ✅ Quill 에디터에 이미지 URL 삽입
                        const range = window.quill.getSelection();
                        window.quill.insertEmbed(range.index, "image", result.imageUrl);
                    } else {
                        alert("이미지 업로드 실패: " + result.message);
                    }
                } catch (error) {
                    console.error("❌ 이미지 업로드 중 오류 발생:", error);
                    alert("이미지 업로드 중 문제가 발생했습니다.");
                }
            }
        });
    });
}

async function fetchPosts(page = 1) {
    try {
        console.log("📌 게시글 목록을 불러옵니다... API_URL:", API_URL);

        const response = await fetch(API_URL);

        // 🔹 HTTP 상태 코드 체크
        if (!response.ok) {
            throw new Error(`❌ 게시글 목록 불러오기 실패: ${response.status} ${response.statusText}`);
        }

        // 🔹 JSON 변환
        const posts = await response.json();
        console.log("📌 불러온 게시글:", posts);

        // 🔹 페이지네이션 적용
        const totalPages = Math.ceil(posts.length / postsPerPage);
        updatePagination(totalPages);

        const start = (page - 1) * postsPerPage;
        const end = start + postsPerPage;
        const paginatedPosts = posts.slice(start, end);

        const postsList = document.getElementById("posts-list");
        postsList.innerHTML = "";

        paginatedPosts.forEach((post, index) => {
            const postDate = new Date(post.createdAt);
            const now = new Date();

            // 📌 오늘 작성된 글인지 확인
            const isToday =
                postDate.getFullYear() === now.getFullYear() &&
                postDate.getMonth() === now.getMonth() &&
                postDate.getDate() === now.getDate();

            // 📌 날짜 포맷 변경 (오늘이면 "HH:mm", 아니면 "YYYY.MM.DD")
            const formattedDate = isToday
            ? postDate.toLocaleTimeString("ko-KR", { 
                hour: "2-digit", 
                minute: "2-digit", 
                hour12: false 
            })
            : postDate.toLocaleDateString("ko-KR", {
                year: "2-digit",
                month: "2-digit",
                day: "2-digit"
            }).replace(/\s/g, "");

            // 📌 댓글 개수 표시
            const commentsCount = post.comments ? post.comments.length : 0;
            const commentsText = commentsCount > 0 
                ? `<span class="comment-count">[${commentsCount}]</span>` 
                : "";

            const truncatedTitle = post.title.length > 45
                ? post.title.substring(0, 45) + "..."
                : post.title;
            
            const truncatedAuthor = post.author.length > 16
                ? post.author.substring(0,16) + "..."
                : post.author;

            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${posts.length - start - index}</td>
                <td><a href="post.html?id=${post._id}">${truncatedTitle} ${commentsText}</a></td>
                <td>${truncatedAuthor || "익명"}</td>
                <td>${formattedDate}</td>
            `;
            postsList.appendChild(row);
        });

    } catch (error) {
        console.error("❌ 게시글 목록 불러오기 실패:", error);
    }
}

// 📌 페이지네이션 업데이트
function updatePagination(totalPages) {
    const pageNumbers = document.getElementById("pageNumbers");
    pageNumbers.innerHTML = "";

    for (let i = 1; i <= totalPages; i++) {
        const pageBtn = document.createElement("button");
        pageBtn.classList.add("page-number");
        if (i === currentPage) pageBtn.classList.add("active");
        pageBtn.innerText = i;
        pageBtn.addEventListener("click", () => {
            currentPage = i;
            localStorage.setItem("currentPage", currentPage);
            fetchPosts(currentPage);
        });
        pageNumbers.appendChild(pageBtn);
    }

    document.getElementById("prevPage").disabled = currentPage === 1;
    document.getElementById("nextPage").disabled = currentPage === totalPages;
}

// 📌 이전/다음 페이지 버튼 기능
document.getElementById("prevPage").addEventListener("click", () => {
    if (currentPage > 1) {
        currentPage--;
        localStorage.setItem("currentPage", currentPage);
        fetchPosts(currentPage);
    }
});

document.getElementById("nextPage").addEventListener("click", () => {
    currentPage++;
    localStorage.setItem("currentPage", currentPage);
    fetchPosts(currentPage);
});

// 📌 글 작성하기 (POST 요청)
async function createPost() {
    const title = document.getElementById("title").value.trim();
    const author = document.getElementById("author").value.trim() || "익명";
    const content = window.quill ? window.quill.root.innerHTML : "";
    const password = document.getElementById("password").value.trim();

    if (!title || !content || !password) {
        alert("제목, 내용, 비밀번호를 입력해주세요!");
        return;
    }

    try {
        const response = await fetch(API_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, author, content, password }),
        });

        if (!response.ok) throw new Error("게시글 작성 실패");

        alert("게시글이 작성되었습니다!");
        window.location.href = "tip.html"; // 목록 페이지로 이동

    } catch (error) {
        console.error("❌ 게시글 작성 오류:", error);
        alert("게시글 작성 중 문제가 발생했습니다.");
    }
}

// 📌 글 삭제하기 (DELETE 요청)
async function deletePost(postId) {
    const password = prompt("게시글을 삭제하려면 비밀번호를 입력하세요:");

    if (!password) {
        alert("비밀번호를 입력해야 삭제할 수 있습니다.");
        return;
    }

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

// 📌 페이지 로드 시 실행
document.addEventListener("DOMContentLoaded", () => {
    fetchPosts(currentPage);

    // 작성 버튼이 있는 페이지에서만 이벤트 추가
    const submitBtn = document.getElementById("submit-btn");
    if (submitBtn) {
        submitBtn.addEventListener("click", createPost);
    }
});
