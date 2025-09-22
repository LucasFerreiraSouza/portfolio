const Conteudo = require("../models/conteudo.model");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const sharp = require("sharp");
const stream = require("stream");

// ---------------- CONFIGURAÇÃO CLOUDINARY ----------------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------- MULTER EM MEMÓRIA ----------------
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ---------------- UPLOAD HELPER ----------------
const uploadToCloudinary = (buffer, publicId, folder = "portfolio") =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        public_id: publicId,
        overwrite: true,
        resource_type: "image",
      },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });

// ==================== CREATE ====================
async function create(req, res) {
  try {
    const { nome, descricao } = req.body;
    if (!req.file) return res.status(400).json({ message: "Imagem obrigatória." });

    // Redimensiona para evitar imagens muito grandes
    const resizedBuffer = await sharp(req.file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .toFormat("png")
      .toBuffer();

    const uploadResult = await uploadToCloudinary(
      resizedBuffer,
      `${Date.now()}_${nome.replace(/\s+/g, "_")}`,
      "portfolio"
    );

    const conteudo = await Conteudo.create({
      nome,
      descricao,
      imagem: uploadResult.secure_url,
    });

    res.status(201).json(conteudo);
  } catch (err) {
    console.error("[Conteudo.create] Erro:", err);
    res.status(400).json({ message: err.message });
  }
}

// ==================== READ (LIST) ====================
async function list(req, res) {
  try {
    const { search } = req.query;
    let query = {};
    if (search) query.nome = { $regex: search, $options: "i" };

    const conteudos = await Conteudo.find(query).sort({ createdAt: -1 }).lean();
    res.json(conteudos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

// ==================== UPDATE ====================
async function update(req, res) {
  try {
    const { id } = req.params;
    const { nome, descricao } = req.body;

    let updateData = { nome, descricao };

    if (req.file) {
      const resizedBuffer = await sharp(req.file.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .toFormat("png")
        .toBuffer();

      const uploadResult = await uploadToCloudinary(resizedBuffer, `${id}_updated`, "portfolio");
      updateData.imagem = uploadResult.secure_url;
    }

    const conteudo = await Conteudo.findByIdAndUpdate(id, updateData, { new: true });
    if (!conteudo) return res.status(404).json({ message: "Conteúdo não encontrado." });

    res.json(conteudo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}

// ==================== DELETE ====================
async function remove(req, res) {
  try {
    const { id } = req.params;
    await Conteudo.findByIdAndDelete(id);
    res.json({ message: "Conteúdo removido." });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

module.exports = {
  upload,
  create,
  list,
  update,
  remove,
};
