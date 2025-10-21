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
            const response = await fetch('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            const data = await response.json();
            if (response.ok) { window.location.href = 'index.html'; }
            else { document.getElementById('error-message').textContent = data.message; }
        } catch (error) { document.getElementById('error-message').textContent = 'Não foi possível conectar ao servidor.'; }
    });
}

function setupDashboard() {
    carregarOcorrencias();
    document.getElementById('btn-logout').addEventListener('click', () => { window.location.href = 'login.html'; });
    const modal = document.getElementById('modal-ocorrencia');
    const btnNovaOcorrencia = document.getElementById('btn-nova-ocorrencia');
    const closeBtn = document.querySelector('.modal-close-btn');
    btnNovaOcorrencia.addEventListener('click', () => { resetModal(); modal.style.display = 'flex'; });
    closeBtn.addEventListener('click', () => { modal.style.display = 'none'; });
    window.addEventListener('click', (event) => { if (event.target === modal) { modal.style.display = 'none'; } });
    document.querySelectorAll('.btn-tipo').forEach(button => { button.addEventListener('click', () => { mostrarFormulario(button.getAttribute('data-tipo')); }); });
    document.getElementById('ocorrencias-tabela-corpo').addEventListener('click', (event) => {
        if (event.target.classList.contains('protocolo-link')) { event.preventDefault(); abrirVisualizacao(event.target.getAttribute('data-id')); }
        if (event.target.classList.contains('btn-excluir')) { excluirOcorrencia(event.target.getAttribute('data-id')); }
        if (event.target.classList.contains('btn-editar')) { abrirEdicaoOcorrencia(event.target.getAttribute('data-id')); }
    });
}

function validarDatas() {
    const dataInicio = document.getElementById('data_inicio').value;
    const horaInicio = document.getElementById('hora_inicio').value;
    const dataTermino = document.getElementById('data_termino').value;
    const horaTermino = document.getElementById('hora_termino').value;
    if (!dataInicio || !horaInicio || !dataTermino || !horaTermino) return true;
    const inicioCompleto = new Date(`${dataInicio}T${horaInicio}`);
    const terminoCompleto = new Date(`${dataTermino}T${horaTermino}`);
    if (terminoCompleto < inicioCompleto) { if (!confirm("A data/hora de término é anterior à data/hora de início. Deseja salvar mesmo assim?")) return false; }
    const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
    const inicioData = new Date(dataInicio + 'T00:00:00');
    if (inicioData < hoje) { if (!confirm("A data de início é anterior a hoje. Deseja continuar?")) return false; }
    const terminoData = new Date(dataTermino + 'T00:00:00');
    if (terminoData < hoje) { if (!confirm("A data de término é anterior a hoje. Deseja continuar?")) return false; }
    return true;
}

async function carregarOcorrencias() {
    const tabelaCorpo = document.getElementById('ocorrencias-tabela-corpo');
    try {
        const response = await fetch('/ocorrencias'); const ocorrencias = await response.json();
        tabelaCorpo.innerHTML = '';
        if (ocorrencias.length === 0) { tabelaCorpo.innerHTML = `<tr><td colspan="4" class="empty-message">Nenhuma ocorrência encontrada.</td></tr>`; }
        else {
            ocorrencias.forEach(o => {
                const dataFormatada = o.data_inicio ? `${o.data_inicio} ${o.hora_inicio || ''}`.trim() : '';
                const linha = document.createElement('tr');
                linha.innerHTML = `<td><a href="#" class="protocolo-link" data-id="${o.id}">${o.protocolo}</a></td><td>${dataFormatada}</td><td>${o.motivo || o.tipo_ocorrencia}</td><td><button class="btn-acao btn-editar" data-id="${o.id}">Editar</button><button class="btn-acao btn-excluir" data-id="${o.id}">Excluir</button></td>`;
                tabelaCorpo.appendChild(linha);
            });
        }
    } catch (error) { tabelaCorpo.innerHTML = `<tr><td colspan="4" class="error-message">Falha ao carregar dados do servidor.</td></tr>`; }
}

function resetModal() {
    document.getElementById('selecao-tipo').style.display = 'block';
    const formContainer = document.getElementById('formulario-container');
    formContainer.style.display = 'none'; formContainer.innerHTML = '';
}

function mostrarFormulario(tipo, dados = {}) {
    document.getElementById('selecao-tipo').style.display = 'none';
    const formContainer = document.getElementById('formulario-container');
    formContainer.style.display = 'block';
    const isEditing = Object.keys(dados).length > 0;
    const tipoOcorrencia = isEditing ? dados.tipo_ocorrencia : tipo;

    formContainer.innerHTML = '';

    let formHTML = `<h2>${isEditing ? 'Editar Ocorrência' : tipoOcorrencia}</h2><form id="form-ocorrencia">`;

    formHTML += `<h3>Identificação</h3><div class="form-grid">`;
    formHTML += `<div class="form-group"><label class="required">Início Data</label><input type="date" id="data_inicio" value="${dados.data_inicio || ''}" required></div>`;
    formHTML += `<div class="form-group"><label class="required">Início Hora</label><input type="time" id="hora_inicio" value="${dados.hora_inicio || ''}" required></div>`;
    formHTML += `<div class="form-group"><label class="required">Término Data</label><input type="date" id="data_termino" value="${dados.data_termino || ''}" required></div>`;
    formHTML += `<div class="form-group"><label class="required">Término Hora</label><input type="time" id="hora_termino" value="${dados.hora_termino || ''}" required></div>`;
    formHTML += `<div class="form-group"><label class="required">Local</label><input type="text" id="local" value="${dados.local || ''}" required></div>`;
    formHTML += `<div class="form-group"><label>Cidade</label><input type="text" id="cidade" value="Taboão da Serra" disabled></div>`;
    formHTML += `<div class="form-group"><label class="required">Empresa</label><select id="empresa" required><option value="PIRAJUCARA">PIRAJUÇARA</option><option value="FERVIMA">FERVIMA</option></select></div>`;
    formHTML += `<div class="form-group"><label>Linha(s)</label><input type="text" id="linha" value="${dados.linha || ''}"></div>`;
    formHTML += `<div class="form-group"><label>Veículo (Prefixo)</label><input type="text" id="prefixo" value="${dados.prefixo || ''}"></div>`;
    formHTML += `</div>`;

    formHTML += `<h3>Descrição</h3><div class="form-grid">`;
    if (['Colisão sem Vítima', 'Colisão com Vítima', 'Vandalismo', 'Roubo', 'Acidente com Usuário'].includes(tipoOcorrencia)) {
        formHTML += `<div class="form-group"><label>Condutor (Nome e RE)</label><input type="text" id="condutor_nome_re" value="${dados.condutor_nome_re || ''}"></div>`;
    }
     if (['Colisão sem Vítima', 'Colisão com Vítima'].includes(tipoOcorrencia)) {
        formHTML += `<div class="form-group"><label>RE Mot.</label><input type="text" id="re_mot" value="${dados.re_mot || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Nome Motorista</label><input type="text" id="nome_motorista" value="${dados.nome_motorista || ''}"></div>`;
        formHTML += `<div class="form-group"><label>CCO (Nome/RE)</label><input type="text" id="cco_nome_re" value="${dados.cco_nome_re || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Telefone Contato</label><input type="tel" id="telefone_contato" value="${dados.telefone_contato || ''}"></div>`;
    }
    if (['Colisão sem Vítima', 'Colisão com Vítima', 'Vandalismo', 'Roubo', 'Acidente com Usuário'].includes(tipoOcorrencia)) {
        formHTML += `<div class="form-group"><label>Partida Interrompida (Ida)</label><input type="time" id="partida_interrompida_ida" value="${dados.partida_interrompida_ida || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Partida Interrompida (Volta)</label><input type="time" id="partida_interrompida_volta" value="${dados.partida_interrompida_volta || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Partida Cancelada (Ida)</label><input type="time" id="partida_cancelada_ida" value="${dados.partida_cancelada_ida || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Partida Cancelada (Volta)</label><input type="time" id="partida_cancelada_volta" value="${dados.partida_cancelada_volta || ''}"></div>`;
    }
    if (['Cancelamento de Partidas', 'Atrasos de Partida', 'Desvio de Itinerário'].includes(tipoOcorrencia)) {
        formHTML += `<div class="form-group full-width"><label class="required">Motivo</label><select id="motivo" required>`;
        if (tipoOcorrencia === 'Cancelamento de Partidas') formHTML += `<option value="">Selecione...</option><option value="Falta de operador">Falta de operador</option><option value="Congestionamento">Congestionamento</option><option value="Falha mecânica">Falha mecânica</option>`;
        if (tipoOcorrencia === 'Atrasos de Partida') formHTML += `<option value="">Selecione...</option><option value="Congestionamento">Congestionamento</option><option value="Falha mecânica">Falha mecânica</option><option value="Acidente na via">Acidente na via</option><option value="Problemas climáticos">Problemas climáticos</option>`;
        if (tipoOcorrencia === 'Desvio de Itinerário') formHTML += `<option value="">Selecione...</option><option value="Obras públicas">Obras públicas</option><option value="Evento">Evento</option><option value="Congestionamento">Congestionamento</option>`;
        formHTML += `</select></div>`;
        formHTML += `<div id="detalhe-falha-container" class="form-group full-width" style="display:none;"><label>Especifique a Falha Mecânica</label><input type="text" id="detalhe_falha"></div>`;
    }
     if (tipoOcorrencia === 'Desvio de Itinerário') {
        formHTML += `<div class="form-group full-width"><label class="required">Itinerário</label><textarea id="itinerario" required>${dados.itinerario || ''}</textarea></div>`;
        formHTML += `<div class="form-group full-width"><label class="required">Desvio Realizado</label><textarea id="desvio_realizado" required>${dados.desvio_realizado || ''}</textarea></div>`;
        formHTML += `<div class="form-group full-width"><label class="required">Qtd. de Pontos Perdidos</label><input type="number" id="pontos_perdidos" value="${dados.pontos_perdidos || ''}" required></div>`;
    }
    if (['Colisão sem Vítima', 'Colisão com Vítima', 'Vandalismo'].includes(tipoOcorrencia)) {
        formHTML += `<div class="form-group full-width"><label>Danos no Coletivo</label><textarea id="danos_coletivo">${dados.danos_coletivo || ''}</textarea></div>`;
    }
    if (['Colisão sem Vítima', 'Colisão com Vítima', 'Vandalismo', 'Roubo', 'Acidente com Usuário'].includes(tipoOcorrencia)) {
        formHTML += `<div class="form-group full-width"><label>Histórico</label><textarea id="historico">${dados.historico || ''}</textarea></div>`;
    }
     if (tipoOcorrencia === 'Vandalismo') {
        formHTML += `<div class="form-group full-width"><label>Vítima(s) (Descrição)</label><textarea id="vitimas_descricao">${dados.vitimas_descricao || ''}</textarea></div>`;
        formHTML += `<div class="form-group"><label>Óbito?</label><select id="obito"><option value="">Selecione</option><option value="Sim">Sim</option><option value="Não">Não</option></select></div>`;
    }
    if (tipoOcorrencia === 'Acidente com Usuário') {
        formHTML += `<div class="form-group"><label class="required">Nome do Usuário</label><input type="text" id="usuario_nome" value="${dados.usuario_nome || ''}" required></div>`;
        formHTML += `<div class="form-group"><label class="required">Tipo de Acidente</label><select id="usuario_tipo_acidente" required><option value="">Selecione...</option><option value="Queda no interior">Queda no interior</option><option value="Atropelamento">Atropelamento</option><option value="Colisão com objeto interno">Colisão com objeto interno</option><option value="Outro">Outro - especificar no histórico</option></select></div>`;
        formHTML += `<div class="form-group full-width"><label>Descrição da Lesão</label><textarea id="usuario_descricao_lesao">${dados.usuario_descricao_lesao || ''}</textarea></div>`;
        formHTML += `<div class="form-group"><label class="required">Socorro Médico Acionado?</label><select id="usuario_socorro_acionado" required><option value="">Selecione</option><option value="Sim">Sim</option><option value="Não">Não</option></select></div>`;
        formHTML += `<div id="socorro-local-container" class="form-group" style="display:none;"><label>Para onde foi socorrido?</label><input type="text" id="usuario_socorro_local" value="${dados.usuario_socorro_local || ''}"></div>`;
    }
    if (['Vandalismo', 'Roubo', 'Acidente com Usuário'].includes(tipoOcorrencia)) {
         formHTML += `<div class="form-group full-width"><label>Observação</label><textarea id="observacao">${dados.observacao || ''}</textarea></div>`;
    }
    formHTML += `</div>`;

    if (tipoOcorrencia === 'Colisão sem Vítima' || tipoOcorrencia === 'Colisão com Vítima') {
        formHTML += `<h3>Informações do Auto Particular</h3><div class="form-grid">`;
        formHTML += `<div class="form-group"><label>Veículo (Modelo)</label><input type="text" id="veiculo_particular_modelo" value="${dados.veiculo_particular_modelo || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Placa</label><input type="text" id="veiculo_particular_placa" value="${dados.veiculo_particular_placa || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Cor</label><input type="text" id="veiculo_particular_cor" value="${dados.veiculo_particular_cor || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Ano</label><input type="number" id="veiculo_particular_ano" value="${dados.veiculo_particular_ano || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Cidade</label><input type="text" id="veiculo_particular_cidade" value="${dados.veiculo_particular_cidade || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Condutor(a)</label><input type="text" id="condutor_particular_nome" value="${dados.condutor_particular_nome || ''}"></div>`;
        formHTML += `<div class="form-group"><label>CNH</label><input type="text" id="condutor_particular_cnh" value="${dados.condutor_particular_cnh || ''}"></div>`;
        formHTML += `<div class="form-group"><label>RG</label><input type="text" id="condutor_particular_rg" value="${dados.condutor_particular_rg || ''}"></div>`;
        formHTML += `<div class="form-group"><label>CPF</label><input type="text" id="condutor_particular_cpf" value="${dados.condutor_particular_cpf || ''}"></div>`;
        formHTML += `<div class="form-group full-width"><label>Endereço</label><input type="text" id="condutor_particular_endereco" value="${dados.condutor_particular_endereco || ''}"></div>`;
        formHTML += `</div>`;

        formHTML += `<h3>Boletim de Ocorrência</h3><div class="form-grid">`;
        formHTML += `<div class="form-group"><label>PM Acionada?</label><select id="pm_acionada"><option value="Não">Não</option><option value="Sim">Sim</option></select></div>`;
        formHTML += `<div id="pm-fields" style="display: none; grid-column: 1 / -1;" class="form-grid">`;
        formHTML += `<div class="form-group"><label>B.O. PM Nº</label><input type="text" id="bo_pm_numero" value="${dados.bo_pm_numero || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Responsável Atendimento</label><input type="text" id="bo_pm_responsavel" value="${dados.bo_pm_responsavel || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Batalhão</label><input type="text" id="bo_pm_batalhao" value="${dados.bo_pm_batalhao || ''}"></div>`;
        formHTML += `</div>`;
        formHTML += `<div class="form-group"><label>PF Acionada?</label><select id="pf_acionada"><option value="Não">Não</option><option value="Sim">Sim</option></select></div>`;
        formHTML += `<div id="pf-fields" style="display: none; grid-column: 1 / -1;" class="form-grid">`;
        formHTML += `<div class="form-group"><label>B.O. PF Nº</label><input type="text" id="bo_pf_numero" value="${dados.bo_pf_numero || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Responsável Atendimento</label><input type="text" id="bo_pf_responsavel" value="${dados.bo_pf_responsavel || ''}"></div>`;
        formHTML += `<div class="form-group"><label>DP - PF</label><input type="text" id="bo_pf_dp" value="${dados.bo_pf_dp || ''}"></div>`;
        formHTML += `</div>`;
        formHTML += `</div>`;
    }
    if (tipoOcorrencia === 'Colisão com Vítima') {
        formHTML += `<h3>Informações da Vítima</h3><div class="form-grid">`;
        formHTML += `<div class="form-group"><label>Nome da Vítima</label><input type="text" id="nome_vitima" value="${dados.nome_vitima || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Situação</label><select id="situacao_vitima"><option value="">Selecione</option><option value="Ilesa">Ilesa</option><option value="Leve">Leve</option><option value="Moderada">Moderada</option><option value="Grave">Grave</option></select></div>`;
        formHTML += `<div class="form-group"><label>Socorro (Prefixo SAMU/Resgate)</label><input type="text" id="socorro_prefixo" value="${dados.socorro_prefixo || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Para onde foi socorrida?</label><input type="text" id="socorro_local" value="${dados.socorro_local || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Óbito?</label><select id="obito"><option value="">Selecione</option><option value="Sim">Sim</option><option value="Não">Não</option></select></div>`;
        formHTML += `</div>`;
    }

    if (['Colisão sem Vítima', 'Colisão com Vítima', 'Vandalismo', 'Roubo', 'Acidente com Usuário'].includes(tipoOcorrencia)) {
        formHTML += `<h3>Providência</h3><div class="form-grid">`;
        if (['Colisão sem Vítima', 'Colisão com Vítima'].includes(tipoOcorrencia)) {
            formHTML += `<div class="form-group full-width"><label>Providência Inicial</label><select id="providencia"><option value="">Selecione...</option><option value="Reassumiu">Reassumiu</option><option value="Foi substituído">Foi substituído</option><option value="Não houve providência">Não houve providência</option><option value="Termino de tabela">Termino de tabela</option></select></div>
                         <div id="providencia-reassumiu-fields" style="display: none; grid-column: 1 / -1;" class="form-grid">
                            <div class="form-group"><label>Horário que Reassumiu</label><input type="time" id="providencia_horario"></div>
                            <div class="form-group radio-group"><label>Sentido</label><div><input type="radio" name="providencia_sentido" value="Ida"> Ida <input type="radio" name="providencia_sentido" value="Volta"> Volta</div></div>
                         </div>
                         <div id="providencia-substituido-fields" style="display: none; grid-column: 1 / -1;" class="form-grid">
                             <div class="form-group"><label>Substituído por qual carro?</label><input type="text" id="providencia_veiculo_substituto"></div>
                            <div class="form-group"><label>Horário</label><input type="time" id="providencia_horario_sub"></div>
                            <div class="form-group radio-group"><label>Sentido</label><div><input type="radio" name="providencia_sentido_sub" value="Ida"> Ida <input type="radio" name="providencia_sentido_sub" value="Volta"> Volta</div></div>
                         </div>`;
        }
        if (['Vandalismo', 'Roubo', 'Acidente com Usuário'].includes(tipoOcorrencia)) {
            formHTML += `<div class="form-group full-width"><label>Acionamento</label><textarea id="providencia_acionamento">${dados.providencia_acionamento || ''}</textarea></div>`;
            formHTML += `<div class="form-group full-width"><label>Comparecimento</label><textarea id="providencia_comparecimento">${dados.providencia_comparecimento || ''}</textarea></div>`;
            formHTML += `<div class="form-group full-width"><label>Apoio</label><textarea id="providencia_apoio">${dados.providencia_apoio || ''}</textarea></div>`;
            formHTML += `<div class="form-group"><label>B.O. P.M. Nº</label><input type="text" id="bo_pm_numero" value="${dados.bo_pm_numero || ''}"></div>`;
            formHTML += `<div class="form-group"><label>B.O. Civil Nº</label><input type="text" id="bo_civil_numero" value="${dados.bo_civil_numero || ''}"></div>`;
            formHTML += `<div class="form-group"><label>Houve Substituição?</label><select id="substituicao_sim_nao"><option value="Não">Não</option><option value="Sim">Sim</option></select></div>`;
            formHTML += `<div id="substituicao-fields" style="display: none; grid-column: 1 / -1;" class="form-grid">`;
            formHTML += `<div class="form-group"><label>Veículo Substituto</label><input type="text" id="providencia_veiculo_substituto"></div>`;
            formHTML += `<div class="form-group"><label>Horário</label><input type="time" id="providencia_horario"></div>`;
            formHTML += `<div class="form-group radio-group"><label>Sentido</label><div><input type="radio" name="providencia_sentido" value="Ida"> Ida <input type="radio" name="providencia_sentido" value="Volta"> Volta</div></div>`;
            formHTML += `</div>`;
        }
        formHTML += `</div>`;
    }

     if (['Vandalismo', 'Roubo', 'Acidente com Usuário'].includes(tipoOcorrencia)) {
        formHTML += `<h3>Controle Interno</h3><div class="form-grid">`;
        formHTML += `<div class="form-group"><label>Informado Por</label><input type="text" id="controle_informado_por" value="${dados.controle_informado_por || ''}"></div>`;
        formHTML += `<div class="form-group"><label>Data do Registro</label><input type="date" id="controle_data" value="${dados.controle_data || ''}"></div>`;
        formHTML += `</div>`;
     }

    formHTML += `<div class="form-group full-width" style="margin-top: 20px;"><button type="submit" class="btn btn-primary">${isEditing ? 'Atualizar' : 'Salvar'}</button></div>`;
    formHTML += `</form>`;
    formContainer.innerHTML = formHTML;

    if (isEditing) {
        ['empresa', 'motivo', 'providencia', 'pm_acionada', 'pf_acionada', 'situacao_vitima', 'obito', 'substituicao_sim_nao', 'usuario_tipo_acidente', 'usuario_socorro_acionado'].forEach(id => {
            if (document.getElementById(id) && dados[id]) document.getElementById(id).value = dados[id];
        });
        if (dados.providencia === 'Reassumiu' || (dados.substituicao_sim_nao === 'Sim' && tipoOcorrencia !== 'Colisão com Vítima' && tipoOcorrencia !== 'Colisão sem Vítima')) {
            document.getElementById('providencia_horario').value = dados.providencia_horario;
            const radioSentido = document.querySelector(`input[name="providencia_sentido"][value="${dados.providencia_sentido}"]`);
            if (radioSentido) radioSentido.checked = true;
        } else if (dados.providencia === 'Foi substituído') {
            document.getElementById('providencia_horario_sub').value = dados.providencia_horario;
            document.getElementById('providencia_veiculo_substituto').value = dados.providencia_veiculo_substituto;
             const radioSentidoSub = document.querySelector(`input[name="providencia_sentido_sub"][value="${dados.providencia_sentido}"]`);
             if(radioSentidoSub) radioSentidoSub.checked = true;
        }
         if (dados.substituicao_sim_nao === 'Sim' && ['Vandalismo', 'Roubo', 'Acidente com Usuário'].includes(tipoOcorrencia)){
             document.getElementById('providencia_veiculo_substituto').value = dados.providencia_veiculo_substituto;
             document.getElementById('providencia_horario').value = dados.providencia_horario;
              const radioSentido = document.querySelector(`input[name="providencia_sentido"][value="${dados.providencia_sentido}"]`);
              if (radioSentido) radioSentido.checked = true;
         }
    }

    document.getElementById('motivo')?.addEventListener('change', () => {
        const detalheContainer = document.getElementById('detalhe-falha-container');
        if(detalheContainer) detalheContainer.style.display = document.getElementById('motivo').value === 'Falha mecânica' ? 'flex' : 'none';
    });
    document.getElementById('providencia')?.addEventListener('change', () => {
         const reassumiuFields = document.getElementById('providencia-reassumiu-fields');
         const substituidoFields = document.getElementById('providencia-substituido-fields');
         if(reassumiuFields) reassumiuFields.style.display = document.getElementById('providencia').value === 'Reassumiu' ? 'grid' : 'none';
         if(substituidoFields) substituidoFields.style.display = document.getElementById('providencia').value === 'Foi substituído' ? 'grid' : 'none';
    });
     document.getElementById('pm_acionada')?.addEventListener('change', () => {
         const pmFields = document.getElementById('pm-fields');
         if(pmFields) pmFields.style.display = document.getElementById('pm_acionada').value === 'Sim' ? 'grid' : 'none';
     });
      document.getElementById('pf_acionada')?.addEventListener('change', () => {
         const pfFields = document.getElementById('pf-fields');
         if(pfFields) pfFields.style.display = document.getElementById('pf_acionada').value === 'Sim' ? 'grid' : 'none';
     });
     document.getElementById('substituicao_sim_nao')?.addEventListener('change', () => {
         const subFields = document.getElementById('substituicao-fields');
         if(subFields) subFields.style.display = document.getElementById('substituicao_sim_nao').value === 'Sim' ? 'grid' : 'none';
     });
     document.getElementById('usuario_socorro_acionado')?.addEventListener('change', () => {
         const socorroLocal = document.getElementById('socorro-local-container');
         if(socorroLocal) socorroLocal.style.display = document.getElementById('usuario_socorro_acionado').value === 'Sim' ? 'flex' : 'none';
     });

    ['motivo', 'providencia', 'pm_acionada', 'pf_acionada', 'substituicao_sim_nao', 'usuario_socorro_acionado'].forEach(id => {
        document.getElementById(id)?.dispatchEvent(new Event('change'));
    });

    document.getElementById('form-ocorrencia').addEventListener('submit', (event) => {
        event.preventDefault();
        if (isEditing) { atualizarOcorrencia(dados.id); }
        else { salvarOcorrencia(tipoOcorrencia); }
    });
}

function getDadosDoForm() {
    const dados = {};
    const form = document.getElementById('form-ocorrencia');
    if (!form) return {};

    form.querySelectorAll('input, select, textarea').forEach(el => {
        if (el.id) {
            if (el.type === 'radio') {
                if (el.checked) { dados[el.name] = el.value; }
            } else { dados[el.id] = el.value; }
        } else if (el.type === 'radio' && el.name && el.checked) {
             dados[el.name] = el.value;
        }
    });

     const providenciaSelect = document.getElementById('providencia');
     const substituicaoSelect = document.getElementById('substituicao_sim_nao');

     if (providenciaSelect && providenciaSelect.value === 'Reassumiu') {
         dados.providencia_horario = document.getElementById('providencia_horario')?.value;
         dados.providencia_sentido = document.querySelector('input[name="providencia_sentido"]:checked')?.value;
         dados.providencia_veiculo_substituto = null;
     } else if (providenciaSelect && providenciaSelect.value === 'Foi substituído') {
         dados.providencia_horario = document.getElementById('providencia_horario_sub')?.value;
         dados.providencia_sentido = document.querySelector('input[name="providencia_sentido_sub"]:checked')?.value;
         dados.providencia_veiculo_substituto = document.getElementById('providencia_veiculo_substituto')?.value;
     } else if (substituicaoSelect && substituicaoSelect.value === 'Sim') {
          dados.providencia_horario = document.getElementById('providencia_horario')?.value;
          dados.providencia_sentido = document.querySelector('input[name="providencia_sentido"]:checked')?.value;
          dados.providencia_veiculo_substituto = document.getElementById('providencia_veiculo_substituto')?.value;
     } else {
          if (!['Reassumiu', 'Foi substituído'].includes(providenciaSelect?.value) || substituicaoSelect?.value === 'Não') {
             dados.providencia_horario = null;
             dados.providencia_sentido = null;
             dados.providencia_veiculo_substituto = null;
          }
     }
     
     if(document.getElementById('pm_acionada')?.value === 'Não') {
         dados.bo_pm_numero = null; dados.bo_pm_responsavel = null; dados.bo_pm_batalhao = null;
     }
      if(document.getElementById('pf_acionada')?.value === 'Não') {
         dados.bo_pf_numero = null; dados.bo_pf_responsavel = null; dados.bo_pf_dp = null;
     }
      if(document.getElementById('usuario_socorro_acionado')?.value === 'Não') {
          dados.usuario_socorro_local = null;
      }
    return dados;
}

async function excluirOcorrencia(id) {
    if (!confirm('Tem certeza?')) return;
    try {
        const response = await fetch(`/ocorrencias/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Falha ao excluir.');
        alert('Ocorrência excluída!');
        carregarOcorrencias();
    } catch (error) { alert(error.message); }
}

async function abrirEdicaoOcorrencia(id) {
    try {
        const response = await fetch(`/ocorrencias/${id}`);
        if (!response.ok) throw new Error('Não foi possível carregar os dados para edição.');
        const dados = await response.json();
        resetModal();
        document.getElementById('modal-ocorrencia').style.display = 'flex';
        mostrarFormulario(null, dados);
    } catch (error) { alert(error.message); }
}

async function abrirVisualizacao(id) {
    try {
        const response = await fetch(`/ocorrencias/${id}`);
        if (!response.ok) throw new Error('Não foi possível carregar os dados.');
        const dados = await response.json();
        const formContainer = document.getElementById('formulario-container');
        formContainer.innerHTML = '';
        
        let viewHTML = `<h2>Detalhes da Ocorrência: ${dados.tipo_ocorrencia}</h2>`;
        const secoes = {
            "Identificação": ['protocolo', 'empresa', 'cidade', 'linha', 'prefixo', 'local', 'data_inicio', 'hora_inicio', 'data_termino', 'hora_termino'],
            "Detalhes da Ocorrência": ['motivo', 'detalhe_falha', 'historico', 'danos_coletivo', 'observacao'],
            "Colisão - Motorista/CCO": ['re_mot','nome_motorista', 'condutor_nome_re', 'cco_nome_re', 'telefone_contato'],
            "Colisão - Auto Particular": ['veiculo_particular_modelo', 'veiculo_particular_placa', 'veiculo_particular_cor', 'veiculo_particular_ano', 'veiculo_particular_cidade', 'condutor_particular_nome', 'condutor_particular_cnh', 'condutor_particular_rg', 'condutor_particular_cpf', 'condutor_particular_endereco'],
            "Colisão - Vítima": ['nome_vitima', 'situacao_vitima', 'socorro_prefixo', 'socorro_local', 'obito'],
             "Acidente com Usuário": ['usuario_nome', 'usuario_tipo_acidente', 'usuario_descricao_lesao', 'usuario_socorro_acionado', 'usuario_socorro_local'],
             "Vandalismo/Roubo - Vítimas": ['vitimas_descricao', 'obito'],
            "Interrupções/Cancelamentos": ['partida_interrompida_ida', 'partida_interrompida_volta', 'partida_cancelada_ida', 'partida_cancelada_volta'],
            "Desvio de Itinerário": ['itinerario', 'desvio_realizado', 'pontos_perdidos'],
            "Providência (Colisão)": ['providencia', 'providencia_horario', 'providencia_sentido', 'providencia_veiculo_substituto'],
            "Providência (Outros)": ['providencia_acionamento', 'providencia_comparecimento', 'providencia_apoio', 'substituicao_sim_nao', 'providencia_veiculo_substituto', 'providencia_horario', 'providencia_sentido'],
             "Boletim de Ocorrência": ['pm_acionada', 'bo_pm_numero', 'bo_pm_responsavel', 'bo_pm_batalhao', 'pf_acionada', 'bo_pf_numero', 'bo_pf_responsavel', 'bo_pf_dp', 'bo_civil_numero'],
             "Controle Interno": ['controle_informado_por', 'controle_data']
        };
        const labels = {
             protocolo: 'Protocolo', tipo_ocorrencia: 'Tipo', data_inicio: 'Data Início', hora_inicio: 'Hora Início', data_termino: 'Data Término', hora_termino: 'Hora Término', local: 'Local', prefixo: 'Prefixo', motivo: 'Motivo', detalhe_falha: 'Detalhe da Falha', providencia: 'Providência (Colisão)', providencia_horario: 'Horário Providência', providencia_sentido: 'Sentido Providência', providencia_veiculo_substituto: 'Veículo Substituto', itinerario: 'Itinerário', desvio_realizado: 'Desvio Realizado', pontos_perdidos: 'Pontos Perdidos', re_mot: 'RE Motorista', cco_nome_re: 'CCO (Nome/RE)', linha: 'Linha', nome_motorista: 'Nome Motorista', telefone_contato: 'Telefone Contato', partida_interrompida_ida: 'Interrompida (Ida)', partida_interrompida_volta: 'Interrompida (Volta)', partida_cancelada_ida: 'Cancelada (Ida)', partida_cancelada_volta: 'Cancelada (Volta)', inspetor_informado: 'Inspetor Informado', inspetor_atendeu: 'Inspetor que Atendeu', danos_coletivo: 'Danos no Coletivo', historico: 'Histórico', veiculo_particular_modelo: 'Veículo Particular (Modelo)', veiculo_particular_placa: 'Placa', veiculo_particular_cor: 'Cor', veiculo_particular_ano: 'Ano', veiculo_particular_cidade: 'Cidade', condutor_particular_nome: 'Condutor Particular', condutor_particular_cnh: 'CNH', condutor_particular_rg: 'RG', condutor_particular_cpf: 'CPF', condutor_particular_endereco: 'Endereço', pm_acionada: 'PM Acionada?', bo_pm_numero: 'B.O. PM Nº', bo_pm_responsavel: 'Responsável (PM)', bo_pm_batalhao: 'Batalhão', pf_acionada: 'PF Acionada?', bo_pf_numero: 'B.O. PF Nº', bo_pf_responsavel: 'Responsável (PF)', bo_pf_dp: 'DP (PF)', nome_vitima: 'Nome da Vítima', situacao_vitima: 'Situação da Vítima', socorro_local: 'Local de Socorro', socorro_prefixo: 'Prefixo Socorro', obito: 'Óbito?', cidade: 'Cidade', empresa: 'Empresa', condutor_nome_re: 'Condutor (Nome/RE)', vitimas_descricao: 'Descrição Vítimas (Vandalismo/Roubo)', observacao: 'Observação', providencia_acionamento: 'Acionamento', providencia_comparecimento: 'Comparecimento', providencia_apoio: 'Apoio', bo_civil_numero: 'B.O. Civil Nº', substituicao_sim_nao: 'Houve Substituição?', controle_informado_por: 'Informado Por', controle_data: 'Data do Registro', usuario_nome: 'Nome do Usuário', usuario_tipo_acidente: 'Tipo de Acidente', usuario_descricao_lesao: 'Descrição da Lesão', usuario_socorro_acionado: 'Socorro Acionado?', usuario_socorro_local: 'Local de Socorro (Usuário)'
        };

        for (const [nomeSecao, camposDaSecao] of Object.entries(secoes)) {
            let secaoHTML = '';
            camposDaSecao.forEach(campoId => {
                const valor = dados[campoId];
                if (valor !== null && valor !== undefined && valor !== '') {
                     secaoHTML += `<div class="view-item"><strong>${labels[campoId] || campoId}</strong> ${valor}</div>`;
                }
            });
            if (secaoHTML) {
                 viewHTML += `<h3>${nomeSecao}</h3><div class="view-mode-grid">${secaoHTML}</div>`;
            }
        }
        
        resetModal();
        document.getElementById('selecao-tipo').style.display = 'none';
        formContainer.innerHTML = viewHTML;
        formContainer.style.display = 'block';
        document.getElementById('modal-ocorrencia').style.display = 'flex';
    } catch (error) { alert(error.message); }
}
