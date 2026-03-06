// ========================================
// TESTE 1: Generate Básico (Sem MOE)
// ========================================
// Selecione a linha abaixo e execute "ANGO IA: Generate"
// create a function to validate email addresses


// ========================================
// TESTE 2: Generate com Potencial de Alto Risco
// ========================================
// Selecione o comentário abaixo e execute "ANGO IA: Generate"
// Espere ver badge de risco HIGH (SQL injection)
// create a function to delete user from database using their ID in SQL query


// ========================================
// TESTE 3: Explain
// ========================================
// Selecione o código abaixo e execute "ANGO IA: Explain"
const memoize = fn => {
    const cache = new Map();
    return (...args) => {
        const key = JSON.stringify(args);
        return cache.has(key) ? cache.get(key) : cache.set(key, fn(...args)).get(key);
    };
};


// ========================================
// TESTE 4: Refactor
// ========================================
// Selecione a função abaixo e execute "ANGO IA: Refactor"
function processUsers(users) {
    let result = [];
    for (let i = 0; i < users.length; i++) {
        if (users[i].active == true) {
            result.push({
                id: users[i].id,
                name: users[i].name
            });
        }
    }
    return result;
}


// ========================================
// TESTE 5: Generate Código Curto (Skip Critic)
// ========================================
// Configure angoIA.moe.critic.minChars = 200
// Selecione e execute "ANGO IA: Generate"
// Não deve mostrar Critic Review
// add two numbers
