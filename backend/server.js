const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

const dbPath = path.resolve(__dirname, 'db', 'database.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Erro ao conectar ao banco de dados:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite.');
        db.run(`CREATE TABLE IF NOT EXISTS ocorrencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            protocolo TEXT NOT NULL UNIQUE,
            tipo_ocorrencia TEXT NOT NULL,
            data_inicio TEXT,
            hora_inicio TEXT,
            data_termino TEXT,
            hora_termino TEXT,
            local TEXT,
            prefixo TEXT,
            motivo TEXT,
            detalhe_falha TEXT,
            providencia TEXT,
            providencia_horario TEXT,
            providencia_sentido TEXT,
            providencia_veiculo_substituto TEXT,
            itinerario TEXT,
            desvio_realizado TEXT,
            pontos_perdidos INTEGER
        )`);
    }
});

function gerarProtocolo(callback) {
    const ano = new Date().getFullYear();
    db.get("SELECT protocolo FROM ocorrencias WHERE protocolo LIKE ? ORDER BY id DESC LIMIT 1", [`%/${ano}`], (err, row) => {
        if (err) return callback(err);
        let proximoNumero = 1;
        if (row) {
            const ultimoNumero = parseInt(row.protocolo.split('/')[0], 10);
            proximoNumero = ultimoNumero + 1;
        }
        const protocoloFormatado = String(proximoNumero).padStart(5, '0') + '/' + ano;
        callback(null, protocoloFormatado);
    });
}

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '1234') {
        res.status(200).json({ message: 'Login bem-sucedido!' });
    } else {
        res.status(401).json({ message: 'Ops, Errou a senha ou o usuário' });
    }
});

app.get('/ocorrencias', (req, res) => {
    db.all("SELECT id, protocolo, data_inicio, hora_inicio, motivo, tipo_ocorrencia FROM ocorrencias ORDER BY id DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

app.get('/ocorrencias/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM ocorrencias WHERE id = ?", id, (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Ocorrência não encontrada." });
        res.json(row);
    });
});

app.post('/ocorrencias', (req, res) => {
    gerarProtocolo((err, protocolo) => {
        if (err) { return res.status(500).json({ error: "Erro ao gerar protocolo." }); }
        const params = [
            protocolo, req.body.tipo_ocorrencia, req.body.data_inicio, req.body.hora_inicio, req.body.data_termino, req.body.hora_termino,
            req.body.local, req.body.prefixo, req.body.motivo, req.body.detalhe_falha, req.body.providencia, req.body.providencia_horario,
            req.body.providencia_sentido, req.body.providencia_veiculo_substituto, req.body.itinerario, req.body.desvio_realizado, req.body.pontos_perdidos
        ];
        const sql = `INSERT INTO ocorrencias (protocolo, tipo_ocorrencia, data_inicio, hora_inicio, data_termino, hora_termino, local, prefixo, motivo, detalhe_falha, 
                     providencia, providencia_horario, providencia_sentido, providencia_veiculo_substituto, itinerario, desvio_realizado, pontos_perdidos) 
                     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        db.run(sql, params, function (err) {
            if (err) { return res.status(500).json({ error: err.message }); }
            res.status(201).json({ id: this.lastID, protocolo });
        });
    });
});

app.put('/ocorrencias/:id', (req, res) => {
    const { id } = req.params;
    const params = [
        req.body.data_inicio, req.body.hora_inicio, req.body.data_termino, req.body.hora_termino, req.body.local, req.body.prefixo, req.body.motivo,
        req.body.detalhe_falha, req.body.providencia, req.body.providencia_horario, req.body.providencia_sentido, req.body.providencia_veiculo_substituto,
        req.body.itinerario, req.body.desvio_realizado, req.body.pontos_perdidos, id
    ];
    const sql = `UPDATE ocorrencias SET 
                    data_inicio = ?, hora_inicio = ?, data_termino = ?, hora_termino = ?, local = ?, prefixo = ?, motivo = ?, detalhe_falha = ?,
                    providencia = ?, providencia_horario = ?, providencia_sentido = ?, providencia_veiculo_substituto = ?,
                    itinerario = ?, desvio_realizado = ?, pontos_perdidos = ?
                 WHERE id = ?`;
    db.run(sql, params, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: "Ocorrência atualizada com sucesso." });
    });
});

app.delete('/ocorrencias/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM ocorrencias WHERE id = ?', id, function (err) {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ message: 'Ocorrência excluída com sucesso' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});