document.addEventListener('DOMContentLoaded', () => {
    if (document.getElementById('login-form')) {
        setupLoginForm();
    }
    if (document.getElementById('ocorrencias-tabela-corpo')) {
        setupDashboard();
    }
});

function setupLoginForm() {
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        document.getElementById('error-message').textContent = '';
        try {
            const response = await fetch('http://localhost:3000/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) {
                window.location.href = 'index.html';
            } else {
                document.getElementById('error-message').textContent = data.message;
            }
        } catch (error) {
            document.getElementById('error-message').textContent = 'Não foi possível conectar ao servidor.';
        }
    });
}

function setupDashboard() {
    carregarOcorrencias();

    document.getElementById('btn-logout').addEventListener('click', () => {
        window.location.href = 'login.html';
    });

    const modal = document.getElementById('modal-ocorrencia');
    const btnNovaOcorrencia = document.getElementById('btn-nova-ocorrencia');
    const closeBtn = document.querySelector('.modal-close-btn');

    btnNovaOcorrencia.addEventListener('click', () => {
        resetModal();
        modal.style.display = 'flex';
    });

    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (event) => { if (event.target === modal) { modal.style.display = 'none'; } });

    document.querySelectorAll('.btn-tipo').forEach(button => {
        button.addEventListener('click', () => { mostrarFormulario(button.getAttribute('data-tipo')); });
    });

    document.getElementById('ocorrencias-tabela-corpo').addEventListener('click', (event) => {
        if (event.target.classList.contains('protocolo-link')) {
            event.preventDefault();
            abrirVisualizacao(event.target.getAttribute('data-id'));
        }
        if (event.target.classList.contains('btn-excluir')) {
            excluirOcorrencia(event.target.getAttribute('data-id'));
        }
        if (event.target.classList.contains('btn-editar')) {
            abrirEdicaoOcorrencia(event.target.getAttribute('data-id'));
        }
    });
}

async function carregarOcorrencias() {
    const tabelaCorpo = document.getElementById('ocorrencias-tabela-corpo');
    try {
        const response = await fetch('http://localhost:3000/ocorrencias');
        const ocorrencias = await response.json();
        tabelaCorpo.innerHTML = '';
        if (ocorrencias.length === 0) {
            tabelaCorpo.innerHTML = `<tr><td colspan="4" class="empty-message">Nenhuma ocorrência encontrada.</td></tr>`;
        } else {
            ocorrencias.forEach(o => {
                const dataFormatada = o.data_inicio ? `${o.data_inicio} ${o.hora_inicio || ''}`.trim() : '';
                const linha = document.createElement('tr');
                linha.innerHTML = `
                    <td><a href="#" class="protocolo-link" data-id="${o.id}">${o.protocolo}</a></td>
                    <td>${dataFormatada}</td>
                    <td>${o.motivo || o.tipo_ocorrencia}</td>
                    <td>
                        <button class="btn-acao btn-editar" data-id="${o.id}">Editar</button>
                        <button class="btn-acao btn-excluir" data-id="${o.id}">Excluir</button>
                    </td>
                `;
                tabelaCorpo.appendChild(linha);
            });
        }
    } catch (error) {
        tabelaCorpo.innerHTML = `<tr><td colspan="4" class="error-message">Falha ao carregar dados do servidor.</td></tr>`;
    }
}

function resetModal() {
    document.getElementById('selecao-tipo').style.display = 'block';
    const formContainer = document.getElementById('formulario-container');
    formContainer.style.display = 'none';
    formContainer.innerHTML = '';
}

function mostrarFormulario(tipo, dados = {}) {
    document.getElementById('selecao-tipo').style.display = 'none';
    const formContainer = document.getElementById('formulario-container');
    formContainer.style.display = 'block';

    const isEditing = Object.keys(dados).length > 0;
    const tipoOcorrencia = isEditing ? dados.tipo_ocorrencia : tipo;

    let formHTML = `<h2>${isEditing ? 'Editar Ocorrência' : tipoOcorrencia}</h2><form id="form-ocorrencia" class="form-grid">`;
    formHTML += `
        <div class="form-group"><label>Data de Início</label><input type="date" id="data_inicio" value="${dados.data_inicio || ''}" required></div>
        <div class="form-group"><label>Hora de Início</label><input type="time" id="hora_inicio" value="${dados.hora_inicio || ''}" required></div>
        <div class="form-group"><label>Data de Término</label><input type="date" id="data_termino" value="${dados.data_termino || ''}" required></div>
        <div class="form-group"><label>Hora de Término</label><input type="time" id="hora_termino" value="${dados.hora_termino || ''}" required></div>
        <div class="form-group"><label>Prefixo</label><input type="text" id="prefixo" value="${dados.prefixo || ''}" required></div>
        <div class="form-group"><label>Local</label><input type="text" id="local" value="${dados.local || ''}" required></div>`;

    if (tipoOcorrencia === 'Cancelamento de Partidas') {
        formHTML += `<div class="form-group full-width"><label>Motivo</label><select id="motivo" required><option value="">Selecione...</option><option value="Falta de operador">Falta de operador</option><option value="Congestionamento">Congestionamento</option><option value="Falha mecânica">Falha mecânica</option></select></div>
                     <div class="form-group full-width"><label>Providência</label><select id="providencia"><option value="">Selecione...</option><option value="Reassumiu">Reassumiu</option><option value="Foi substituído">Foi substituído</option><option value="Não houve providência">Não houve providência</option><option value="Termino de tabela">Termino de tabela</option></select></div>
                     <div id="providencia-reassumiu-fields" style="display: none; grid-column: 1 / -1;" class="form-grid">
                        <div class="form-group"><label>Horário que Reassumiu</label><input type="time" id="providencia_horario"></div>
                        <div class="form-group radio-group"><label>Sentido</label><div><input type="radio" name="providencia_sentido" value="Ida"> Ida <input type="radio" name="providencia_sentido" value="Volta"> Volta</div></div>
                     </div>
                     <div id="providencia-substituido-fields" style="display: none; grid-column: 1 / -1;" class="form-grid">
                        <div class="form-group"><label>Substituído por qual carro?</label><input type="text" id="providencia_veiculo_substituto"></div>
                        <div class="form-group"><label>Horário</label><input type="time" id="providencia_horario_sub"></div>
                        <div class="form-group radio-group"><label>Sentido</label><div><input type="radio" name="providencia_sentido_sub" value="Ida"> Ida <input type="radio" name="providencia_sentido_sub" value="Volta"> Volta</div></div>
                     </div>`;
    } else if (tipoOcorrencia === 'Atrasos de Partida') {
        formHTML += `<div class="form-group full-width"><label>Motivo</label><select id="motivo" required><option value="">Selecione...</option><option value="Congestionamento">Congestionamento</option><option value="Falha mecânica">Falha mecânica</option><option value="Acidente na via">Acidente na via</option><option value="Problemas climáticos">Problemas climáticos</option></select></div>`;
    } else if (tipoOcorrencia === 'Desvio de Itinerário') {
        formHTML += `<div class="form-group full-width"><label>Motivo</label><select id="motivo" required><option value="">Selecione...</option><option value="Obras públicas">Obras públicas</option><option value="Evento">Evento</option><option value="Congestionamento">Congestionamento</option></select></div>
                     <div class="form-group full-width"><label>Itinerário</label><textarea id="itinerario" required></textarea></div>
                     <div class="form-group full-width"><label>Desvio Realizado</label><textarea id="desvio_realizado" required></textarea></div>
                     <div class="form-group full-width"><label>Qtd. de Pontos Perdidos</label><input type="number" id="pontos_perdidos" required></div>`;
    }
    
    formHTML += `<div id="detalhe-falha-container" class="form-group full-width" style="display:none;"><label>Especifique a Falha Mecânica</label><input type="text" id="detalhe_falha"></div>
                 <div class="form-group full-width"><button type="submit" class="btn btn-primary">${isEditing ? 'Atualizar' : 'Salvar'}</button></div></form>`;
    formContainer.innerHTML = formHTML;

    // Preencher dados na edição
    if (isEditing) {
        ['motivo', 'providencia', 'itinerario', 'desvio_realizado', 'pontos_perdidos'].forEach(id => {
            if (document.getElementById(id) && dados[id]) document.getElementById(id).value = dados[id];
        });
        if (dados.providencia === 'Reassumiu') {
            document.getElementById('providencia_horario').value = dados.providencia_horario;
            document.querySelector(`input[name="providencia_sentido"][value="${dados.providencia_sentido}"]`).checked = true;
        } else if (dados.providencia === 'Foi substituído') {
            document.getElementById('providencia_horario_sub').value = dados.providencia_horario;
            document.getElementById('providencia_veiculo_substituto').value = dados.providencia_veiculo_substituto;
            document.querySelector(`input[name="providencia_sentido_sub"][value="${dados.providencia_sentido}"]`).checked = true;
        }
    }

    // Lógicas de exibição condicional e eventos
    const motivoSelect = document.getElementById('motivo');
    if (motivoSelect) {
        motivoSelect.addEventListener('change', () => { document.getElementById('detalhe-falha-container').style.display = motivoSelect.value === 'Falha mecânica' ? 'flex' : 'none'; });
        motivoSelect.dispatchEvent(new Event('change'));
    }
    const providenciaSelect = document.getElementById('providencia');
    if (providenciaSelect) {
        providenciaSelect.addEventListener('change', () => {
            document.getElementById('providencia-reassumiu-fields').style.display = providenciaSelect.value === 'Reassumiu' ? 'grid' : 'none';
            document.getElementById('providencia-substituido-fields').style.display = providenciaSelect.value === 'Foi substituído' ? 'grid' : 'none';
        });
        providenciaSelect.dispatchEvent(new Event('change'));
    }
    document.getElementById('form-ocorrencia').addEventListener('submit', (event) => {
        event.preventDefault();
        if (isEditing) { atualizarOcorrencia(dados.id); } else { salvarOcorrencia(tipoOcorrencia); }
    });
}

async function salvarOcorrencia(tipo) {
    const dados = { tipo_ocorrencia: tipo, ...getDadosDoForm() };
    try {
        const response = await fetch('http://localhost:3000/ocorrencias', {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados)
        });
        if (!response.ok) throw new Error('Falha ao salvar ocorrência.');
        alert('Ocorrência criada com sucesso!');
        document.getElementById('modal-ocorrencia').style.display = 'none';
        carregarOcorrencias();
    } catch (error) { alert(error.message); }
}

async function atualizarOcorrencia(id) {
    const dados = getDadosDoForm();
    try {
        const response = await fetch(`http://localhost:3000/ocorrencias/${id}`, {
            method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(dados)
        });
        if (!response.ok) throw new Error('Falha ao atualizar a ocorrência.');
        alert('Ocorrência atualizada com sucesso!');
        document.getElementById('modal-ocorrencia').style.display = 'none';
        carregarOcorrencias();
    } catch (error) { alert(error.message); }
}

function getDadosDoForm() {
    const providencia = document.getElementById('providencia')?.value;
    let providenciaHorario, providenciaSentido;
    if (providencia === 'Reassumiu') {
        providenciaHorario = document.getElementById('providencia_horario').value;
        providenciaSentido = document.querySelector('input[name="providencia_sentido"]:checked')?.value;
    } else if (providencia === 'Foi substituído') {
        providenciaHorario = document.getElementById('providencia_horario_sub').value;
        providenciaSentido = document.querySelector('input[name="providencia_sentido_sub"]:checked')?.value;
    }
    return {
        data_inicio: document.getElementById('data_inicio').value, hora_inicio: document.getElementById('hora_inicio').value,
        data_termino: document.getElementById('data_termino').value, hora_termino: document.getElementById('hora_termino').value,
        local: document.getElementById('local').value, prefixo: document.getElementById('prefixo').value,
        motivo: document.getElementById('motivo')?.value, detalhe_falha: document.getElementById('detalhe_falha')?.value,
        providencia: providencia, providencia_horario: providenciaHorario, providencia_sentido: providenciaSentido,
        providencia_veiculo_substituto: document.getElementById('providencia_veiculo_substituto')?.value,
        itinerario: document.getElementById('itinerario')?.value, desvio_realizado: document.getElementById('desvio_realizado')?.value,
        pontos_perdidos: document.getElementById('pontos_perdidos')?.value
    };
}

async function excluirOcorrencia(id) {
    if (!confirm('Tem certeza?')) return;
    try {
        const response = await fetch(`http://localhost:3000/ocorrencias/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Falha ao excluir.');
        alert('Ocorrência excluída!');
        carregarOcorrencias();
    } catch (error) { alert(error.message); }
}

async function abrirEdicaoOcorrencia(id) {
    try {
        const response = await fetch(`http://localhost:3000/ocorrencias/${id}`);
        if (!response.ok) throw new Error('Não foi possível carregar os dados para edição.');
        const dados = await response.json();
        resetModal();
        document.getElementById('modal-ocorrencia').style.display = 'flex';
        mostrarFormulario(null, dados);
    } catch (error) { alert(error.message); }
}

async function abrirVisualizacao(id) {
    try {
        const response = await fetch(`http://localhost:3000/ocorrencias/${id}`);
        if (!response.ok) throw new Error('Não foi possível carregar os dados.');
        const dados = await response.json();
        
        const formContainer = document.getElementById('formulario-container');
        let viewHTML = `<h2>Detalhes da Ocorrência</h2><div class="view-mode-grid">`;
        const campos = {
            'Protocolo': dados.protocolo, 'Tipo': dados.tipo_ocorrencia, 'Data Início': dados.data_inicio, 'Hora Início': dados.hora_inicio,
            'Data Término': dados.data_termino, 'Hora Término': dados.hora_termino, 'Prefixo': dados.prefixo, 'Local': dados.local, 'Motivo': dados.motivo,
            'Detalhe da Falha': dados.detalhe_falha, 'Providência': dados.providencia, 'Horário Providência': dados.providencia_horario,
            'Sentido Providência': dados.providencia_sentido, 'Veículo Substituto': dados.providencia_veiculo_substituto,
            'Itinerário': dados.itinerario, 'Desvio Realizado': dados.desvio_realizado, 'Pontos Perdidos': dados.pontos_perdidos
        };
        for (const [label, valor] of Object.entries(campos)) {
            if (valor) {
                viewHTML += `<div class="view-item"><strong>${label}</strong> ${valor}</div>`;
            }
        }
        viewHTML += `</div>`;
        
        resetModal();
        document.getElementById('selecao-tipo').style.display = 'none';
        formContainer.innerHTML = viewHTML;
        formContainer.style.display = 'block';
        document.getElementById('modal-ocorrencia').style.display = 'flex';
    } catch (error) { alert(error.message); }
}