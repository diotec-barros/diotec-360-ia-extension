"""
DIOTEC 360 IA - Arquivo de Demonstração
Sistema Bancário com Bugs Intencionais para Demo

⚠️ ATENÇÃO: Este código contém bugs propositais para demonstração.
NÃO USE EM PRODUÇÃO!
"""

class BankAccount:
    def __init__(self, account_number: str, balance: float):
        self.account_number = account_number
        self.balance = balance
        self.transactions = []

    def get_balance(self) -> float:
        return self.balance


def calculate_interest(principal: float, rate: float, days: int) -> float:
    """
    Calcula juros simples para um período em dias.
    
    BUG INTENCIONAL #1: Não trata divisão por zero quando days = 0
    BUG INTENCIONAL #2: Não valida se principal e rate são positivos
    """
    daily_rate = rate / 365
    interest = principal * daily_rate * days
    return interest


def transfer_funds(from_account: BankAccount, to_account: BankAccount, amount: float) -> bool:
    """
    Transfere fundos entre duas contas.
    
    BUG INTENCIONAL #3: Não verifica se from_account tem saldo suficiente
    BUG INTENCIONAL #4: Não trata valores negativos
    BUG INTENCIONAL #5: Não registra a transação em ambas as contas
    """
    from_account.balance -= amount
    to_account.balance += amount
    
    # Registra apenas na conta de origem (BUG!)
    from_account.transactions.append({
        'type': 'transfer_out',
        'amount': amount,
        'to': to_account.account_number
    })
    
    return True


def calculate_loan_payment(principal: float, annual_rate: float, months: int) -> float:
    """
    Calcula pagamento mensal de empréstimo usando fórmula de amortização.
    
    BUG INTENCIONAL #6: Não trata caso onde months = 0
    BUG INTENCIONAL #7: Fórmula incorreta quando rate = 0 (empréstimo sem juros)
    """
    monthly_rate = annual_rate / 12 / 100
    
    # Fórmula de amortização (Price)
    payment = principal * (monthly_rate * (1 + monthly_rate) ** months) / \
              ((1 + monthly_rate) ** months - 1)
    
    return payment


def validate_transaction(amount: float, account: BankAccount, transaction_type: str) -> bool:
    """
    Valida se uma transação pode ser executada.
    
    BUG INTENCIONAL #8: Não verifica limites diários
    BUG INTENCIONAL #9: Não valida tipos de transação permitidos
    BUG INTENCIONAL #10: Retorna True mesmo quando deveria rejeitar
    """
    if amount <= 0:
        return True  # BUG: deveria retornar False!
    
    if transaction_type == 'withdrawal' and account.balance < amount:
        return True  # BUG: deveria retornar False!
    
    return True


def calculate_overdraft_fee(overdraft_amount: float) -> float:
    """
    Calcula taxa de cheque especial.
    
    BUG INTENCIONAL #11: Não trata valores negativos corretamente
    BUG INTENCIONAL #12: Taxa fixa não considera regulamentação do Banco Central
    """
    base_fee = 50.0  # Taxa fixa
    percentage_fee = overdraft_amount * 0.15  # 15% sobre o valor
    
    return base_fee + percentage_fee


def process_batch_transfers(transfers: list) -> dict:
    """
    Processa múltiplas transferências em lote.
    
    BUG INTENCIONAL #13: Não é atômico (se uma falhar, as anteriores já foram executadas)
    BUG INTENCIONAL #14: Não valida estrutura dos dados de entrada
    BUG INTENCIONAL #15: Não trata exceções
    """
    results = {
        'successful': 0,
        'failed': 0,
        'total_amount': 0.0
    }
    
    for transfer in transfers:
        from_acc = transfer['from']
        to_acc = transfer['to']
        amount = transfer['amount']
        
        # Executa sem validação (BUG!)
        transfer_funds(from_acc, to_acc, amount)
        
        results['successful'] += 1
        results['total_amount'] += amount
    
    return results


# Exemplo de uso (para demonstração)
if __name__ == "__main__":
    # Cria contas de teste
    account_a = BankAccount("001-12345", 1000.0)
    account_b = BankAccount("001-67890", 500.0)
    
    # Testa transferência (vai permitir saldo negativo!)
    print(f"Saldo A antes: {account_a.get_balance()}")
    transfer_funds(account_a, account_b, 1500.0)  # Mais do que tem!
    print(f"Saldo A depois: {account_a.get_balance()}")  # Vai ficar negativo!
    
    # Testa cálculo de juros (vai dar erro se days = 0!)
    try:
        interest = calculate_interest(1000.0, 0.05, 0)
        print(f"Juros: {interest}")
    except ZeroDivisionError:
        print("ERRO: Divisão por zero!")
    
    # Testa validação (vai aceitar valores inválidos!)
    is_valid = validate_transaction(-100.0, account_a, 'withdrawal')
    print(f"Transação de -100 é válida? {is_valid}")  # Deveria ser False!
