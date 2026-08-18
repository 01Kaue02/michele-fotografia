// Lê o parâmetro "cat" da URL (ex: ?cat=fotografia-pet)
const params = new URLSearchParams(window.location.search);
const categoria = params.get('cat');

// Endereço da nossa API (backend rodando localmente por enquanto)
const API_URL = 'http://localhost:3000/api/servicos';

async function carregarServicos() {
  try {
    const resposta = await fetch(`${API_URL}/${categoria}`);
    const servicos = await resposta.json();

    renderizarServicos(servicos);
  } catch (erro) {
    console.error('Erro ao buscar serviços:', erro);
    document.getElementById('lista-servicos').innerHTML =
      '<p>Não foi possível carregar os serviços agora. Tente novamente mais tarde.</p>';
  }
}

function renderizarServicos(servicos) {
  const container = document.getElementById('lista-servicos');

  if (servicos.length === 0) {
    container.innerHTML = '<p>Nenhum serviço cadastrado nessa categoria ainda.</p>';
    return;
  }
  

 container.innerHTML = servicos.map(servico => `
    <div class="item-servico">
      <div>
        <h3>${servico.nome}</h3>
        <p>${servico.descricao}</p>
      </div>
      <div class="preco">
        ${servico.preco_antigo ? `<span class="preco-antigo">R$ ${servico.preco_antigo}</span>` : ''}
        <span class="preco-atual">R$ ${servico.preco_atual}</span>
      </div>
      <a href="agendar.html?servico_id=${servico.id}" class="btn btn-primary">Agendar</a>
    </div>
  `).join('');
}

carregarServicos();