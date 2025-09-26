// // Configuração do display

// // função para gerar chave unica e imutavel de 6 digitos de A a F e de 0 a 9
// function gerarChaveUnica() {
//     var caracteres = 'ABCDEF0123456789';
//     var chave = '';
//     for (var i = 0; i < 6; i++) {
//         var indiceAleatorio = Math.floor(Math.random() * caracteres.length);
//         chave += caracteres.charAt(indiceAleatorio);
//     }
//     return chave;
// }

// // função para exibir a chave unica no display
// function exibirChaveUnica() {
//     var chaveUnica = gerarChaveUnica();
//     document.getElementById('showKey').innerHTML = 'Chave Unica: ' + chaveUnica;
// }

// // função para exibir a chave unica no display ao carregar a pagina
// window.onload = function() {
//     exibirChaveUnica();
// }

// //buscar chave unica no display na API