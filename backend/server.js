const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'login.html'));
});

app.use(express.static(path.join(__dirname, '..', 'frontend')));

const db = new sqlite3.Database(':memory:', (err) => {
    if (err) {
        console.error('Erro fatal ao conectar ao banco de dados em memória:', err.message);
    } else {
        console.log('Conectado ao banco de dados SQLite em memória.');
        db.run(`DROP TABLE IF EXISTS ocorrencias`); // Garante recriação da tabela com novas colunas
        db.run(`CREATE TABLE ocorrencias (
            id INTEGER PRIMARY KEY AUTOINCREMENT, protocolo TEXT NOT NULL UNIQUE, tipo_ocorrencia TEXT NOT NULL, 
            data_inicio TEXT, hora_inicio TEXT, data_termino TEXT, hora_termino TEXT, local TEXT, prefixo TEXT, 
            motivo TEXT, detalhe_falha TEXT, providencia TEXT, providencia_horario TEXT, providencia_sentido TEXT, 
            providencia_veiculo_substituto TEXT, itinerario TEXT, desvio_realizado TEXT, pontos_perdidos INTEGER,
            re_mot TEXT, cco_nome_re TEXT, linha TEXT, nome_motorista TEXT, telefone_contato TEXT, 
            partida_interrompida_ida TEXT, partida_interrompida_volta TEXT, partida_cancelada_ida TEXT, 
            partida_cancelada_volta TEXT, inspetor_informado TEXT, inspetor_atendeu TEXT, danos_coletivo TEXT, 
            historico TEXT, veiculo_particular_modelo TEXT, veiculo_particular_placa TEXT, veiculo_particular_cor TEXT, 
            veiculo_particular_ano TEXT, veiculo_particular_cidade TEXT, condutor_particular_nome TEXT, 
            condutor_particular_cnh TEXT, condutor_particular_rg TEXT, condutor_particular_cpf TEXT, 
            condutor_particular_endereco TEXT, pm_acionada TEXT, bo_pm_numero TEXT, bo_pm_responsavel TEXT, 
            bo_pm_batalhao TEXT, pf_acionada TEXT, bo_pf_numero TEXT, bo_pf_responsavel TEXT, bo_pf_dp TEXT, 
            nome_vitima TEXT, situacao_vitima TEXT, socorro_local TEXT, socorro_prefixo TEXT, obito TEXT, 
            cidade TEXT, empresa TEXT, condutor_nome_re TEXT, vitimas_descricao TEXT, observacao TEXT, 
            providencia_acionamento TEXT, providencia_comparecimento TEXT, providencia_apoio TEXT, 
            bo_civil_numero TEXT, substituicao_sim_nao TEXT, controle_informado_por TEXT, controle_data TEXT, 
            usuario_nome TEXT, usuario_tipo_acidente TEXT, usuario_descricao_lesao TEXT, 
            usuario_socorro_acionado TEXT, usuario_socorro_local TEXT
        )`, (err) => {
            if (err) console.error("Erro ao criar tabela:", err.message);
        });
    }
});

function gerarProtocoloSimples() {
    const timestamp = Date.now();
    return `${timestamp}`.slice(-5) + '/' + new Date().getFullYear();
}

app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === 'admin' && password === '1234') { res.status(200).json({ message: 'Login bem-sucedido!' }); } 
    else { res.status(401).json({ message: 'Ops, Errou a senha ou o usuário' }); }
});

app.get('/ocorrencias', (req, res) => {
    db.all("SELECT id, protocolo, data_inicio, hora_inicio, motivo, tipo_ocorrencia FROM ocorrencias ORDER BY id DESC", [], (err, rows) => {
        if (err) {
            console.error("Erro em GET /ocorrencias:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

app.get('/ocorrencias/:id', (req, res) => {
    const { id } = req.params;
    db.get("SELECT * FROM ocorrencias WHERE id = ?", id, (err, row) => {
        if (err) {
            console.error("Erro em GET /ocorrencias/:id:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json(row || {});
    });
});

app.post('/ocorrencias', (req, res) => {
    const protocolo = gerarProtocoloSimples();
    const fields = [ // Lista de todos os campos possíveis em ordem
        'protocolo', 'tipo_ocorrencia', 'data_inicio', 'hora_inicio', 'data_termino', 'hora_termino', 'local', 'prefixo', 'motivo', 
        'detalhe_falha', 'providencia', 'providencia_horario', 'providencia_sentido', 'providencia_veiculo_substituto', 
        'itinerario', 'desvio_realizado', 'pontos_perdidos', 're_mot', 'cco_nome_re', 'linha', 'nome_motorista', 
        'telefone_contato', 'partida_interrompida_ida', 'partida_interrompida_volta', 'partida_cancelada_ida', 
        'partida_cancelada_volta', 'inspetor_informado', 'inspetor_atendeu', 'danos_coletivo', 'historico', 
        'veiculo_particular_modelo', 'veiculo_particular_placa', 'veiculo_particular_cor', 'veiculo_particular_ano', 
        'veiculo_particular_cidade', 'condutor_particular_nome', 'condutor_particular_cnh', 'condutor_particular_rg', 
        'condutor_particular_cpf', 'condutor_particular_endereco', 'pm_acionada', 'bo_pm_numero', 'bo_pm_responsavel', 
        'bo_pm_batalhao', 'pf_acionada', 'bo_pf_numero', 'bo_pf_responsavel', 'bo_pf_dp', 'nome_vitima', 
        'situacao_vitima', 'socorro_local', 'socorro_prefixo', 'obito', 'cidade', 'empresa', 'condutor_nome_re', 
        'vitimas_descricao', 'observacao', 'providencia_acionamento', 'providencia_comparecimento', 'providencia_apoio', 
        'bo_civil_numero', 'substituicao_sim_nao', 'controle_informado_por', 'controle_data', 'usuario_nome', 
        'usuario_tipo_acidente', 'usuario_descricao_lesao', 'usuario_socorro_acionado', 'usuario_socorro_local'
    ];
    
    const placeholders = fields.map(() => '?').join(',');
    const values = fields.map(field => req.body[field] || null); // Pega o valor do corpo da requisição ou null
    values[0] = protocolo; // Garante que o protocolo gerado seja usado

    const sql = `INSERT INTO ocorrencias (${fields.join(',')}) VALUES (${placeholders})`;

    db.run(sql, values, function (err) {
        if (err) {
            console.error("Erro SQLITE (POST):", err);
            return res.status(500).json({ error: err.message });
        }
        res.status(201).json({ id: this.lastID, protocolo });
    });
});

app.put('/ocorrencias/:id', (req, res) => {
    const { id } = req.params;
    const fieldsToUpdate = [ // Campos que podem ser atualizados (exclui id e protocolo)
        'tipo_ocorrencia', 'data_inicio', 'hora_inicio', 'data_termino', 'hora_termino', 'local', 'prefixo', 'motivo', 
        'detalhe_falha', 'providencia', 'providencia_horario', 'providencia_sentido', 'providencia_veiculo_substituto', 
        'itinerario', 'desvio_realizado', 'pontos_perdidos', 're_mot', 'cco_nome_re', 'linha', 'nome_motorista', 
        'telefone_contato', 'partida_interrompida_ida', 'partida_interrompida_volta', 'partida_cancelada_ida', 
        'partida_cancelada_volta', 'inspetor_informado', 'inspetor_atendeu', 'danos_coletivo', 'historico', 
        'veiculo_particular_modelo', 'veiculo_particular_placa', 'veiculo_particular_cor', 'veiculo_particular_ano', 
        'veiculo_particular_cidade', 'condutor_particular_nome', 'condutor_particular_cnh', 'condutor_particular_rg', 
        'condutor_particular_cpf', 'condutor_particular_endereco', 'pm_acionada', 'bo_pm_numero', 'bo_pm_responsavel', 
        'bo_pm_batalhao', 'pf_acionada', 'bo_pf_numero', 'bo_pf_responsavel', 'bo_pf_dp', 'nome_vitima', 
        'situacao_vitima', 'socorro_local', 'socorro_prefixo', 'obito', 'cidade', 'empresa', 'condutor_nome_re', 
        'vitimas_descricao', 'observacao', 'providencia_acionamento', 'providencia_comparecimento', 'providencia_apoio', 
        'bo_civil_numero', 'substituicao_sim_nao', 'controle_informado_por', 'controle_data', 'usuario_nome', 
        'usuario_tipo_acidente', 'usuario_descricao_lesao', 'usuario_socorro_acionado', 'usuario_socorro_local'
    ];
    
    const setClause = fieldsToUpdate.map(field => `${field} = ?`).join(', ');
    const values = fieldsToUpdate.map(field => req.body[field] || null);
    values.push(id); // Adiciona o ID no final para a cláusula WHERE

    const sql = `UPDATE ocorrencias SET ${setClause} WHERE id = ?`;

    db.run(sql, values, function (err) {
        if (err) {
            console.error("Erro SQLITE (PUT):", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: "Ocorrência atualizada com sucesso." });
    });
});

app.delete('/ocorrencias/:id', (req, res) => {
    const { id } = req.params;
    db.run('DELETE FROM ocorrencias WHERE id = ?', id, function (err) {
        if (err) {
            console.error("Erro em DELETE /ocorrencias/:id:", err);
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Ocorrência excluída com sucesso' });
    });
});

app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
});