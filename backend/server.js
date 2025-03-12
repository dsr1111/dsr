require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const Post = require("./models/Post");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const sharp = require("sharp");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
    origin: "*",  // 모든 도메인 허용 (보안상 필요시 특정 도메인만 허용)
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false // Cloudtype에서 CORS 문제 발생 가능성이 있으므로 false 설정
}));

// ✅ OPTIONS 요청을 허용하는 미들웨어 추가
app.options("*", (req, res) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");
    res.sendStatus(200);
});

// 📌 업로드 폴더 확인 및 생성
const uploadDir = path.join(__dirname, "upload");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// 📌 Multer 설정 (메모리에 저장 후 Sharp로 변환)
const storage = multer.memoryStorage();
const upload = multer({ storage });

// 📌 이미지 업로드 API (Base64 → URL로 변환)
app.post("/upload", upload.single("image"), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: "이미지가 필요합니다." });
        }

        // 📌 파일명 생성
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
        const filePath = path.join(uploadDir, fileName);

        // 📌 Sharp로 이미지 압축 후 저장
        await sharp(req.file.buffer)
            .webp({ quality: 75 }) // ✅ WebP 포맷으로 압축
            .toFile(filePath);

        // 📌 업로드된 이미지의 URL 반환
        const imageUrl = `https://port-0-dsr-m85aqy8qfc2589fd.sel4.cloudtype.app/upload/${fileName}`;
        res.json({ success: true, imageUrl });

    } catch (error) {
        console.error("❌ 이미지 업로드 실패:", error);
        res.status(500).json({ success: false, message: "이미지 업로드 실패" });
    }
});

// 📌 정적 파일 제공 (업로드된 이미지 접근 가능)
app.use("/upload", express.static(uploadDir));

app.use("/image", express.static(path.join(__dirname, "image")));

// 📌 JSON 데이터를 요청에서 사용할 수 있도록 설정
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 📌 정적 파일 제공 (프론트엔드)
app.use(express.static(path.join(__dirname)));

const mongoURI = process.env.MONGO_URI; // 🔹 환경 변수에서 가져오기

if (!mongoURI) {
    console.error("❌ MONGO_URI 환경 변수가 설정되지 않았습니다.");
    process.exit(1); // 🔹 서버 실행 중지
}

mongoose.connect(mongoURI)
    .then(() => console.log("✅ MongoDB 연결 성공!"))
    .catch(err => console.error("❌ MongoDB 연결 실패:", err));

// 📌 ✅ 게시판 API 라우트 추가
// 📌 1️⃣ 글 작성 (Create)
app.post("/posts", async (req, res) => {
    try {
        let { title, content, author, password } = req.body;
        if (!title || !content || !password) {
            return res.status(400).json({ message: "제목, 내용, 비밀번호를 입력해주세요." });
        }

        // 📌 Base64 이미지 찾기
        const base64Images = content.match(/<img.*?src=["'](data:image\/.*?;base64,.*?)["']/g);

        if (base64Images) {
            for (let base64Image of base64Images) {
                let base64Data = base64Image.match(/src=["'](data:image\/.*?;base64,.*?)["']/)[1];

                // 📌 Base64 데이터를 이미지 파일로 변환 후 업로드
                const buffer = Buffer.from(base64Data.split(",")[1], "base64");
                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.webp`;
                const filePath = path.join(uploadDir, fileName);

                await sharp(buffer)
                    .resize({ width: 1100 })
                    .webp({ quality: 100 })
                    .toFile(filePath);

                // 📌 변환된 이미지 URL
                const imageUrl = `https://port-0-dsr-m85aqy8qfc2589fd.sel4.cloudtype.app/upload/${fileName}`;

                // 📌 HTML에서 Base64 → URL로 변경
                content = content.replace(base64Data, imageUrl);
            }
        }

        const newPost = new Post({ title, content, author, password });
        await newPost.save();

        res.status(201).json({ message: "게시글이 작성되었습니다!", post: newPost });
    } catch (error) {
        console.error("❌ 게시글 작성 오류:", error);
        res.status(500).json({ message: "서버 오류 발생", error });
    }
});


// 📌 2️⃣ 글 목록 조회 (Read)
app.get("/posts", async (req, res) => {
    try {
        const posts = await Post.find()
            .sort({ createdAt: -1 }) // 최신순 정렬
            .select("title author createdAt comments"); // 내용(content) 제외

        // 🔹 댓글 개수 추가
        const formattedPosts = posts.map(post => ({
            _id: post._id,
            title: post.title,
            author: post.author,
            createdAt: post.createdAt,
            commentCount: post.comments.length, // 댓글 개수만 보냄
        }));

        res.json(formattedPosts);
    } catch (error) {
        console.error("❌ 게시글 목록 불러오기 오류:", error);
        res.status(500).json({ message: "서버 오류 발생" });
    }
});

// 📌 3️⃣ 특정 글 조회 (Read)
app.get("/posts/:id", async (req, res) => {
    try {
        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }
        res.json(post);
    } catch (error) {
        console.error("❌ 특정 글 조회 오류:", error);
        res.status(500).json({ message: "서버 오류 발생", error });
    }
});

// 📌 4️⃣ 글 수정 (Update)
app.put("/posts/:id", async (req, res) => {
    try {
        const { title, content, author, password } = req.body; // ✅ 새로운 비밀번호를 받음
        const post = await Post.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        // 🚨 비밀번호가 비어 있으면 수정 거부
        if (!password || password.trim() === "") {
            return res.status(400).json({ message: "비밀번호를 입력해야 수정할 수 있습니다." });
        }

        // ✅ 게시글 데이터 업데이트
        post.title = title;
        post.content = content;
        post.author = author;
        post.password = password; // 🔹 기존 비밀번호를 새 비밀번호로 덮어쓰기

        await post.save(); // 🔹 변경사항 저장

        res.json({ message: "게시글이 수정되었습니다." });

    } catch (error) {
        console.error("❌ 글 수정 오류:", error);
        res.status(500).json({ message: "서버 오류 발생", error });
    }
});


app.post("/posts/:id/verify-password", async (req, res) => {
    const { id } = req.params;
    const { password } = req.body;

    try {
        const post = await Post.findById(id);
        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        // 🔹 비밀번호 검증
        if (post.password !== password) {
            return res.status(401).json({ message: "비밀번호가 틀렸습니다." });
        }

        res.json({ message: "비밀번호가 확인되었습니다." });

    } catch (error) {
        console.error("❌ 비밀번호 검증 오류:", error);
        res.status(500).json({ message: "서버 오류가 발생했습니다." });
    }
});


// 📌 5️⃣ 글 삭제 (Delete)
app.delete("/posts/:id", async (req, res) => {
    try {
        const { password } = req.body; // 클라이언트에서 전달된 비밀번호
        if (!password) {
            return res.status(400).json({ message: "비밀번호를 입력하세요." });
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        if (post.password !== password) {
            return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
        }

        await Post.findByIdAndDelete(req.params.id);
        res.json({ message: "게시글이 삭제되었습니다." });
    } catch (error) {
        console.error("❌ 게시글 삭제 오류:", error);
        res.status(500).json({ message: "서버 오류 발생", error });
    }
});

// 📌 특정 게시글에 댓글 추가 (POST 요청)
app.post("/posts/:id/comments", async (req, res) => {
    try {
        const { author, content, password, createdAt } = req.body;

        if (!author || !content || !password) {
            return res.status(400).json({ message: "작성자, 비밀번호, 댓글 내용을 입력하세요." });
        }

        const post = await Post.findById(req.params.id);
        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        const newComment = {
            _id: new mongoose.Types.ObjectId(), // 🔹 Mongoose가 자동으로 _id 생성
            author,
            content,
            password,
            createdAt: createdAt || new Date()
        };

        post.comments.push(newComment);
        await post.save();

        res.status(201).json({ message: "댓글이 작성되었습니다!", comment: newComment });
    } catch (error) {
        console.error("❌ 댓글 작성 오류:", error);
        res.status(500).json({ message: "댓글 작성 실패", error: error.message });
    }
});

app.delete("/posts/:postId/comments/:commentId", async (req, res) => {
    try {
        const { password } = req.body;
        const { postId, commentId } = req.params;

        if (!postId || !commentId) {
            return res.status(400).json({ message: "잘못된 요청입니다. postId 또는 commentId가 없습니다." });
        }

        const post = await Post.findById(postId);
        if (!post) {
            return res.status(404).json({ message: "게시글을 찾을 수 없습니다." });
        }

        // 해당 댓글 찾기
        const commentIndex = post.comments.findIndex(comment => comment._id.toString() === commentId);
        if (commentIndex === -1) {
            return res.status(404).json({ message: "댓글을 찾을 수 없습니다." });
        }

        // 비밀번호 확인
        if (post.comments[commentIndex].password !== password) {
            return res.status(403).json({ message: "비밀번호가 일치하지 않습니다." });
        }

        // 댓글 삭제
        post.comments.splice(commentIndex, 1);
        await post.save();

        res.status(200).json({ message: "댓글이 삭제되었습니다!" });
    } catch (error) {
        console.error("❌ 댓글 삭제 오류:", error);
        res.status(500).json({ message: "댓글 삭제 실패", error: error.message });
    }
});


// 📌 🚀 서버 실행
app.listen(PORT, () => {
    console.log(`✅ 서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});

app.get("/posts", async (req, res) => {
    console.time("fetchPosts");
    const posts = await Post.find(); // 데이터 조회
    console.timeEnd("fetchPosts");
    res.json(posts);
});