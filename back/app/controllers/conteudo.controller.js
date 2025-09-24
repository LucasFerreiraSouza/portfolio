const Conteudo = require("../models/conteudo.model");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const sharp = require("sharp");
const stream = require("stream");
const connectDB = require("../config/db.config");

// Configuração do Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper para upload de imagens
const uploadToCloudinary = (buffer, publicId, folder = "portfolio") =>
  new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder, public_id: publicId, overwrite: true, resource_type: "image" },
      (error, result) => (error ? reject(error) : resolve(result))
    );
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);
    bufferStream.pipe(uploadStream);
  });

// Multer para upload
const upload = multer({ storage: multer.memoryStorage() });

/* LIST */
async function list(req, res) {
  try {
    await connectDB();
    const { search, secao } = req.query;
    let query = {};
    if (search) query.nome = { $regex: search, $options: "i" };
    if (secao) query["secao.nome"] = secao;

    const conteudos = await Conteudo.find(query)
      .sort({ "secao.ordem": 1, ordem: 1 })
      .lean();
    res.json(conteudos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* FIND ONE */
async function findOne(req, res) {
  try {
    await connectDB();
    const conteudo = await Conteudo.findById(req.params.id).lean();
    if (!conteudo) return res.status(404).json({ message: "Conteúdo não encontrado." });
    res.json(conteudo);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* CREATE */
async function create(req, res) {
  try {
    await connectDB();
    const { nome, descricao, secao } = req.body;

    if (!nome || !descricao || !secao) {
      return res.status(400).json({ message: "Nome, descrição e seção são obrigatórios." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "Imagem obrigatória." });
    }

    const resizedBuffer = await sharp(req.file.buffer)
      .resize({ width: 800, withoutEnlargement: true })
      .toFormat("png")
      .toBuffer();

    const publicId = `${Date.now()}_${nome.replace(/\s+/g, "_")}`;
    const uploadResult = await uploadToCloudinary(resizedBuffer, publicId, "portfolio");

    // Define a ordem dentro da seção
    const lastConteudo = await Conteudo.findOne({ "secao.nome": secao }).sort({ ordem: -1 });
    const nextOrder = lastConteudo ? lastConteudo.ordem + 1 : 0;

    const conteudo = await Conteudo.create({
      nome,
      descricao,
      imagem: uploadResult.secure_url,
      publicId: uploadResult.public_id,
      secao: { nome: secao, ordem: 0 }, // <-- usa o nome da seção do form
      ordem: nextOrder,
    });

    res.status(201).json(conteudo);
  } catch (err) {
    console.error(err);
    res.status(400).json({ message: err.message });
  }
}

/* UPDATE */
async function update(req, res) {
  try {
    await connectDB();
    const { id } = req.params;
    const { nome, descricao, secao } = req.body;

    if (!nome || !descricao || !secao) {
      return res.status(400).json({ message: "Nome, descrição e seção são obrigatórios." });
    }

    const conteudoExistente = await Conteudo.findById(id);
    if (!conteudoExistente) return res.status(404).json({ message: "Conteúdo não encontrado." });

    let updateData = {
      nome,
      descricao,
      secao: { nome: secao, ordem: conteudoExistente.secao.ordem }, // mantém a ordem antiga
    };

    if (req.file) {
      if (conteudoExistente.publicId) {
        await cloudinary.uploader.destroy(conteudoExistente.publicId);
      }

      const resizedBuffer = await sharp(req.file.buffer)
        .resize({ width: 800, withoutEnlargement: true })
        .toFormat("png")
        .toBuffer();

      const publicId = `${id}_updated`;
      const uploadResult = await uploadToCloudinary(resizedBuffer, publicId, "portfolio");

      updateData.imagem = uploadResult.secure_url;
      updateData.publicId = uploadResult.public_id;
    }

    const conteudo = await Conteudo.findByIdAndUpdate(id, updateData, { new: true });
    res.json(conteudo);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
}


/* DELETE */
async function remove(req, res) {
  try {
    await connectDB();
    const { id } = req.params;

    const conteudo = await Conteudo.findById(id);
    if (!conteudo) return res.status(404).json({ message: "Conteúdo não encontrado." });

    if (conteudo.publicId) {
      await cloudinary.uploader.destroy(conteudo.publicId);
    }

    await Conteudo.findByIdAndDelete(id);
    res.json({ message: "Conteúdo removido com sucesso!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* LIST BY SECTION */
async function listBySecao(req, res) {
  try {
    await connectDB();
    const conteudos = await Conteudo.find().lean();

    const agrupados = conteudos
      .sort((a, b) => a.secao.ordem - b.secao.ordem || a.ordem - b.ordem)
      .reduce((acc, item) => {
        const secaoNome = item.secao.nome;
        if (!acc[secaoNome]) acc[secaoNome] = { ordem: item.secao.ordem, itens: [] };
        acc[secaoNome].itens.push({
          _id: item._id,
          nome: item.nome,
          descricao: item.descricao,
          imagem: item.imagem,
          secao: item.secao.nome,
          ordem: item.ordem
        });
        return acc;
      }, {});

    res.json(Object.values(agrupados));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* UPDATE CONTENT ORDER */
async function updateOrder(req, res) {
  try {
    await connectDB();
    const { itens } = req.body; 
    // itens: [{ id, ordem, secaoNome }]

    // Garantindo que só mova dentro da mesma seção
    const bulkOps = itens.map(item => ({
      updateOne: {
        filter: { _id: item.id, "secao.nome": item.secaoNome },
        update: { ordem: item.ordem }
      }
    }));

    await Conteudo.bulkWrite(bulkOps);
    res.json({ message: "Ordem de conteúdos atualizada!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}

/* UPDATE SECTION ORDER */
async function updateSectionOrder(req, res) {
  try {
    await connectDB();
    const { secoes } = req.body; // [{ nome, ordem }]
    const bulkOps = secoes.map(sec => ({
      updateMany: {
        filter: { "secao.nome": sec.nome },
        update: { "secao.ordem": sec.ordem }
      }
    }));

    await Conteudo.bulkWrite(bulkOps);
    res.json({ message: "Ordem das seções atualizada!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}


/* UPDATE SECTION NAME / DESCRIPTION */
async function updateSection(req, res) {
  try {
    await connectDB();
    const { nome } = req.params; // nome antigo
    const { novoNome, descricao } = req.body; // campos a atualizar

    if (!novoNome && !descricao) {
      return res.status(400).json({ message: "Informe novoNome ou descricao" });
    }

    // Atualiza todos os conteúdos que pertencem a essa seção
    const updateData = {};
    if (novoNome) updateData["secao.nome"] = novoNome;
    if (descricao) updateData.descricao = descricao;

    await Conteudo.updateMany({ "secao.nome": nome }, updateData);

    res.json({ message: "Seção atualizada com sucesso!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}




module.exports = {
  upload,
  create,
  list,
  listBySecao,
  findOne,
  update,
  remove,
  updateOrder,
  updateSectionOrder,
  updateSection
};