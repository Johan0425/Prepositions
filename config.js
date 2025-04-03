// config.js - Core logic for proposition analysis

class PropositionAnalyzer {
  constructor(options = {}) {
    this.maxPropositions = options.maxPropositions || 20;
    this.maxTextLength = options.maxTextLength || 5000;
    this.symbols = new Map([
      ['∧', 'AND'],
      ['∨', 'OR'],
      ['¬', 'NOT'],
      ['→', 'IMPLIES'],
      ['↔', 'IFF'],
      ['⊤', 'TRUE'],
      ['⊥', 'FALSE']
    ]);
    this.variableMeanings = new Map();
  }

  // Validate input text
  validateInput(text) {
    if (!text || text.trim() === '') {
      return { valid: false, message: 'El texto no puede estar vacío.' };
    }
    if (text.length < 10) {
      return { valid: false, message: 'El texto debe tener al menos 10 caracteres.' };
    }
    if (text.length > this.maxTextLength) {
      return { valid: false, message: `El texto no debe exceder los ${this.maxTextLength} caracteres.` };
    }
    return { valid: true };
  }

  // Validate proposition variables
  validatePropositionVariables(variables) {
    if (!variables || variables.length < 2) {
      return { valid: false, message: 'Debe proporcionar al menos dos proposiciones.' };
    }
    if (variables.length > this.maxPropositions) {
      return { valid: false, message: `No puede exceder el máximo de ${this.maxPropositions} proposiciones.` };
    }
    const uniqueVars = new Set(variables.map(v => v.symbol));
    if (uniqueVars.size !== variables.length) {
      return { valid: false, message: 'No puede haber símbolos de proposición duplicados.' };
    }
    const invalidVars = variables.filter(v => !/^[a-z]$/.test(v.symbol));
    if (invalidVars.length > 0) {
      return { valid: false, message: 'Los símbolos de proposición deben ser letras minúsculas (a-z).' };
    }
    return { valid: true };
  }

  findBestVariableMatch(clause, variables) {
    const normalize = (str) => str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      // Handle common verb variations (e.g., "recibirá" → "recibe")
      .replace(/irá\b/g, 'e')
      .replace(/ará\b/g, 'a');

    const normalizedClause = normalize(clause);
    const clauseWords = normalizedClause.split(/\s+/);

    let bestMatch = null;
    let bestMatchScore = 0;

    for (const variable of variables) {
      const normalizedMeaning = normalize(variable.meaning);
      const meaningWords = normalizedMeaning.split(/\s+/);

      let score = 0;
      for (const word of meaningWords) {
        if (clauseWords.includes(word)) {
          score++;
        }
      }

      score = score / Math.max(meaningWords.length, 1);

      if (score > 0) {
        score += (score * clauseWords.length) / 10;
      }

      if (score > bestMatchScore) {
        bestMatchScore = score;
        bestMatch = variable;
      }
    }

    if (bestMatchScore >= 0.3) {
      console.log(`Matched clause "${clause}" to variable ${bestMatch.symbol}: ${bestMatch.meaning} (score: ${bestMatchScore})`);
      return bestMatch;
    }

    console.log(`No match found for clause "${clause}" (best score: ${bestMatchScore})`);
    return null;
  }

  // Parse and validate a logical expression
  parseExpression(expression) {
    try {
      if (!expression || expression.trim() === '') {
        return { valid: false, message: 'La expresión lógica no puede estar vacía.' };
      }
      const stack = [];
      for (let i = 0; i < expression.length; i++) {
        if (expression[i] === '(') {
          stack.push(expression[i]);
        } else if (expression[i] === ')') {
          if (stack.length === 0 || stack[stack.length - 1] !== '(') {
            return { valid: false, message: 'Paréntesis no balanceados en la expresión.' };
          }
          stack.pop();
        }
      }
      if (stack.length > 0) {
        return { valid: false, message: 'Paréntesis no balanceados en la expresión.' };
      }
      const ast = this.buildAST(expression);
      return { valid: true, ast };
    } catch (error) {
      return { valid: false, message: `Error al analizar la expresión: ${error.message}` };
    }
  }

  // Build an Abstract Syntax Tree (AST) from a logical expression
  buildAST(expression) {
    const tokens = this.tokenize(expression);
    const ast = this.parseTokens(tokens);
    return {
      type: 'expression',
      value: expression,
      ast: ast
    };
  }

  tokenize(expression) {
    const tokens = [];
    let currentToken = '';
    for (let i = 0; i < expression.length; i++) {
      const char = expression[i];
      if (['∧', '∨', '¬', '→', '↔', '(', ')', '⊤', '⊥'].includes(char)) {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
        tokens.push(char);
      } else if (char === ' ') {
        if (currentToken) {
          tokens.push(currentToken);
          currentToken = '';
        }
      } else {
        currentToken += char;
      }
    }
    if (currentToken) {
      tokens.push(currentToken);
    }
    return tokens;
  }

  parseTokens(tokens) {
    let index = 0;

    const parseExpression = () => parseImplication();

    const parseImplication = () => {
      let left = parseDisjunction();
      while (index < tokens.length && tokens[index] === '→') {
        const operator = tokens[index++];
        const right = parseDisjunction();
        left = { type: 'binary', operator, left, right };
      }
      return left;
    };

    const parseDisjunction = () => {
      let left = parseConjunction();
      while (index < tokens.length && tokens[index] === '∨') {
        const operator = tokens[index++];
        const right = parseConjunction();
        left = { type: 'binary', operator, left, right };
      }
      return left;
    };

    const parseConjunction = () => {
      let left = parseNegation();
      while (index < tokens.length && tokens[index] === '∧') {
        const operator = tokens[index++];
        const right = parseNegation();
        left = { type: 'binary', operator, left, right };
      }
      return left;
    };

    const parseNegation = () => {
      if (index < tokens.length && tokens[index] === '¬') {
        const operator = tokens[index++];
        const argument = parseNegation();
        return { type: 'unary', operator, argument };
      }
      return parsePrimary();
    };

    const parsePrimary = () => {
      if (index >= tokens.length) {
        throw new Error('Unexpected end of expression');
      }
      if (tokens[index] === '(') {
        index++;
        const expr = parseExpression();
        if (index >= tokens.length || tokens[index] !== ')') {
          throw new Error('Expected closing parenthesis');
        }
        index++;
        return expr;
      }
      if (['⊤', '⊥'].includes(tokens[index])) {
        return { type: 'constant', value: tokens[index++] };
      }
      if (/^[a-z]$/.test(tokens[index])) {
        return { type: 'variable', name: tokens[index++] };
      }
      throw new Error(`Unexpected token: ${tokens[index]}`);
    };

    const result = parseExpression();
    if (index < tokens.length) {
      throw new Error(`Unexpected token after expression: ${tokens[index]}`);
    }
    return result;
  }

  // Extract logical expression from text
  extractLogicalExpression(text, variables) {
    console.log(`Extracting logical expression from text: "${text}"`);
    console.log(`Variables: ${JSON.stringify(variables)}`);

    const normalizedText = text.toLowerCase().replace(/\s+/g, ' ').trim();
    const relationships = [];

    const sentences = normalizedText.split(/(?<!\bno)\.\s*/).filter(s => s.trim());
    console.log(`Sentences: ${JSON.stringify(sentences)}`);

    for (let i = 0; i < sentences.length; i++) {
      let sentence = sentences[i].trim();
      console.log(`Processing sentence: "${sentence}"`);

      const implicationMatch = sentence.match(/si ([^,]+)(?:,)?\s+entonces ([^,\.]+)/i);
      if (implicationMatch) {
        let antecedent = implicationMatch[1].trim();
        let consequent = implicationMatch[2].trim();
        console.log(`Implication found - Antecedent: "${antecedent}", Consequent: "${consequent}"`);

        if (i + 1 < sentences.length && sentences[i + 1].trim().startsWith('pero')) {
          i++;
          const nextSentence = sentences[i].replace(/^pero\s*/i, '').trim();
          console.log(`Next sentence (after 'pero'): "${nextSentence}"`);

          const nextImplicationMatch = nextSentence.match(/si ([^,]+)(?:,)?\s+entonces ([^,\.]+)/i);
          if (nextImplicationMatch) {
            const nextAntecedent = nextImplicationMatch[1].trim();
            const nextConsequent = nextImplicationMatch[2].trim();
            console.log(`Second implication found - Antecedent: "${nextAntecedent}", Consequent: "${nextConsequent}"`);

            let antecedentExpr1, consequentExpr1, antecedentExpr2, consequentExpr2;
            try {
              antecedentExpr1 = this.parseClause(antecedent, variables);
              consequentExpr1 = this.parseClause(consequent, variables);
              antecedentExpr2 = this.parseClause(nextAntecedent, variables);
              consequentExpr2 = this.parseClause(nextConsequent, variables);
            } catch (error) {
              throw new Error(`Error al parsear las cláusulas: ${error.message}`);
            }

            if (antecedentExpr1 && consequentExpr1 && antecedentExpr2 && consequentExpr2) {
              relationships.push({
                type: 'implication',
                raw: `(${antecedentExpr1}) → (${consequentExpr1}) ∧ (${antecedentExpr2}) → (${consequentExpr2})`
              });
              console.log(`Added relationship: (${antecedentExpr1}) → (${consequentExpr1}) ∧ (${antecedentExpr2}) → (${consequentExpr2})`);
            } else {
              console.log(`Failed to parse implication: (${antecedentExpr1}) → (${consequentExpr1}) ∧ (${antecedentExpr2}) → (${consequentExpr2})`);
              throw new Error('No se pudo parsear una de las cláusulas en las implicaciones.');
            }
          } else {
            console.log(`No implication found in sentence after 'pero': "${nextSentence}"`);
            throw new Error('La oración después de "pero" no sigue el formato "si ... entonces ...".');
          }
          continue;
        }

        let antecedentExpr, consequentExpr;
        try {
          antecedentExpr = this.parseClause(antecedent, variables);
          consequentExpr = this.parseClause(consequent, variables);
        } catch (error) {
          throw new Error(`Error al parsear las cláusulas: ${error.message}`);
        }

        if (antecedentExpr && consequentExpr) {
          relationships.push({
            type: 'implication',
            raw: `(${antecedentExpr}) → (${consequentExpr})`
          });
          console.log(`Added relationship: (${antecedentExpr}) → (${consequentExpr})`);
        } else {
          console.log(`Failed to parse implication: (${antecedentExpr}) → (${consequentExpr})`);
          throw new Error('No se pudo parsear una de las cláusulas en la implicación.');
        }
      } else {
        let expr;
        try {
          expr = this.parseClause(sentence, variables);
        } catch (error) {
          console.log(`Error parsing direct statement: ${error.message}`);
          continue; // Skip this sentence if it can't be parsed
        }
        if (expr) {
          relationships.push({
            type: 'statement',
            raw: expr
          });
          console.log(`Added direct statement: ${expr}`);
        } else {
          console.log(`No logical structure identified in sentence: "${sentence}"`);
        }
      }
    }

    if (relationships.length === 0) {
      console.log('No relationships identified in the text.');
      throw new Error('No se pudo identificar una estructura lógica válida en el texto. Asegúrate de que el texto contenga implicaciones (e.g., "si ... entonces ...") o declaraciones directas que coincidan con las proposiciones definidas.');
    }

    const finalExpression = relationships.map(r => r.raw).join(' ∧ ');
    console.log(`Final logical expression: ${finalExpression}`);
    return finalExpression;
  }

  // Parse a clause (antecedent or consequent) to handle conjunctions, disjunctions, and negations
  parseClause(clause, variables) {
    console.log(`Parsing clause: "${clause}"`);

    let isNegated = false;
    if (clause.startsWith('no ')) {
      isNegated = true;
      clause = clause.replace('no ', '').trim();
    }

    const conjunctionMatch = clause.match(/([^,\.]+) y ([^,\.]+)/i);
    if (conjunctionMatch) {
      const left = conjunctionMatch[1].trim();
      const right = conjunctionMatch[2].trim();
      const leftExpr = this.parseClause(left, variables);
      const rightExpr = this.parseClause(right, variables);
      if (leftExpr && rightExpr) {
        const expr = `(${leftExpr} ∧ ${rightExpr})`;
        return isNegated ? `¬${expr}` : expr;
      }
    }

    const disjunctionMatch = clause.match(/([^,\.]+) o ([^,\.]+)/i);
    if (disjunctionMatch) {
      const left = disjunctionMatch[1].trim();
      const right = disjunctionMatch[2].trim();
      const leftExpr = this.parseClause(left, variables);
      const rightExpr = this.parseClause(right, variables);
      if (leftExpr && rightExpr) {
        const expr = `(${leftExpr} ∨ ${rightExpr})`;
        return isNegated ? `¬${expr}` : expr;
      }
    }

    const variable = this.findBestVariableMatch(clause, variables);
    if (variable) {
      return isNegated ? `¬${variable.symbol}` : variable.symbol;
    }

    throw new Error(`No se pudo mapear la cláusula "${clause}" a ninguna variable. Asegúrate de que todas las proposiciones en el texto tengan una variable definida.`);
  }


  // Generate truth table for the expression
  generateTruthTable(ast, variables) {
    const variableSymbols = variables.map(v => v.symbol);
    const rows = [];
    const combinations = this.generateCombinations(variableSymbols.length);

    for (const combination of combinations) {
      const variableValues = {};
      for (let i = 0; i < variableSymbols.length; i++) {
        variableValues[variableSymbols[i]] = combination[i];
      }
      const result = this.evaluateExpression(ast.ast, variableValues);
      rows.push({ values: variableValues, result });
    }

    return rows;
  }

  generateCombinations(n) {
    const combinations = [];
    const max = Math.pow(2, n);
    for (let i = 0; i < max; i++) {
      const binary = i.toString(2).padStart(n, '0');
      const combination = binary.split('').map(bit => bit === '1');
      combinations.push(combination);
    }
    return combinations;
  }

  // Evaluate the expression using the AST
  evaluateExpression(node, variableValues) {
    if (node.type === 'variable') {
      return variableValues[node.name] !== undefined ? variableValues[node.name] : false;
    }
    if (node.type === 'constant') {
      return node.value === '⊤';
    }
    if (node.type === 'unary' && node.operator === '¬') {
      return !this.evaluateExpression(node.argument, variableValues);
    }
    if (node.type === 'binary') {
      const left = this.evaluateExpression(node.left, variableValues);
      const right = this.evaluateExpression(node.right, variableValues);
      switch (node.operator) {
        case '∧':
          return left && right;
        case '∨':
          return left || right;
        case '→':
          return !left || right;
        case '↔':
          return left === right;
        default:
          throw new Error(`Unknown operator: ${node.operator}`);
      }
    }
    throw new Error(`Unknown node type: ${node.type}`);
  }

  // Analyze the text and variables
  analyze(text, variables) {
    const textValidation = this.validateInput(text);
    if (!textValidation.valid) {
      return { error: textValidation.message };
    }

    const variablesValidation = this.validatePropositionVariables(variables);
    if (!variablesValidation.valid) {
      return { error: variablesValidation.message };
    }

    const expression = this.extractLogicalExpression(text, variables);
    const expressionValidation = this.parseExpression(expression);
    if (!expressionValidation.valid) {
      return { error: expressionValidation.message };
    }

    this.variableMeanings.clear();
    variables.forEach(v => this.variableMeanings.set(v.symbol, v.meaning));

    const truthTable = this.generateTruthTable(expressionValidation.ast, variables);
    const allTrue = truthTable.every(row => row.result === true);
    const allFalse = truthTable.every(row => row.result === false);

    let expressionType;
    if (allTrue) {
      expressionType = 'Tautología';
    } else if (allFalse) {
      expressionType = 'Contradicción';
    } else {
      expressionType = 'Contingencia';
    }

    return {
      originalText: text,
      variables,
      expression,
      expressionType,
      truthTable,
      ast: expressionValidation.ast,
      timestamp: new Date().toISOString()
    };
  }

  // Convert logical expression to natural language
  expressionToNaturalLanguage(expression) {
    let natural = expression;
    natural = natural
      .replace(/→/g, ' implica que ')
      .replace(/∧/g, ' y ')
      .replace(/∨/g, ' o ')
      .replace(/¬/g, 'no ')
      .replace(/↔/g, ' si y solo si ');

    for (const [symbol, meaning] of this.variableMeanings.entries()) {
      const regex = new RegExp(`\\b${symbol}\\b`, 'g');
      natural = natural.replace(regex, `"${meaning}"`);
    }

    return natural.trim();
  }

  // Generate HTML for results
  generateHTML(results) {
    if (results.error) {
      return `<div class="error">${results.error}</div>`;
    }

    let html = `
      <div class="analysis-result">
        <h3>Análisis de la expresión: ${results.expression}</h3>
        <div class="variables-section">
          <h4>Proposiciones:</h4>
          <ul>
    `;

    results.variables.forEach(v => {
      html += `<li><strong>${v.symbol}:</strong> ${v.meaning}</li>`;
    });

    html += `
          </ul>
        </div>
        <div class="expression-section">
          <h4>Expresión en lenguaje natural:</h4>
          <p>${this.expressionToNaturalLanguage(results.expression)}</p>
        </div>
        <div class="result-section">
          <h4>Tipo de expresión: ${results.expressionType}</h4>
        </div>
        <div class="truth-table">
          <h4>Tabla de verdad:</h4>
          <table>
            <thead>
              <tr>
    `;

    results.variables.forEach(v => {
      html += `<th>${v.symbol}</th>`;
    });

    html += `
                <th>${results.expression}</th>
              </tr>
            </thead>
            <tbody>
    `;

    results.truthTable.forEach(row => {
      html += '<tr>';
      results.variables.forEach(v => {
        html += `<td>${row.values[v.symbol] ? 'V' : 'F'}</td>`;
      });
      html += `<td>${row.result ? 'V' : 'F'}</td>`;
      html += '</tr>';
    });

    html += `
            </tbody>
          </table>
        </div>
      </div>
    `;

    return html;
  }

  // Export results to JSON
  exportToJSON(results) {
    return JSON.stringify(results, null, 2);
  }
}

// storage.js - Handles local storage operations

class AnalysisStorage {
  constructor(maxEntries = 10) {
    this.storageKey = 'logical-proposition-analysis-history';
    this.maxEntries = maxEntries;
  }

  saveAnalysis(results) {
    try {
      const history = this.getHistory();
      history.unshift(results);
      if (history.length > this.maxEntries) {
        history.pop();
      }
      localStorage.setItem(this.storageKey, JSON.stringify(history));
      return true;
    } catch (error) {
      console.error('Error saving analysis:', error);
      return false;
    }
  }

  getHistory() {
    try {
      const history = localStorage.getItem(this.storageKey);
      return history ? JSON.parse(history) : [];
    } catch (error) {
      console.error('Error retrieving history:', error);
      return [];
    }
  }

  clearHistory() {
    localStorage.removeItem(this.storageKey);
  }

  getAnalysis(index) {
    const history = this.getHistory();
    return history[index] || null;
  }
}

// ui.js - Handles user interface interactions

class PropositionUI {
  constructor(analyzer, storage) {
    this.analyzer = analyzer;
    this.storage = storage;
    this.currentVariables = [];
    this.currentResults = null;
    this.currentTheme = localStorage.getItem('theme') || 'light';
    this.initElements();
    this.initSymbolButtons();
    this.initEventListeners();
    this.loadHistory();
    this.applyTheme();
    this.updateCharCount();
  }

  initElements() {
    this.textArea = document.getElementById('text-input');
    this.expressionInput = document.getElementById('expression-input');
    this.charCounter = document.getElementById('char-counter');
    this.variableSymbolInput = document.getElementById('variable-symbol');
    this.variableMeaningInput = document.getElementById('variable-meaning');
    this.addVariableBtn = document.getElementById('add-variable-btn');
    this.variablesList = document.getElementById('variables-list');
    this.analyzeBtn = document.getElementById('analyze-btn');
    this.clearBtn = document.getElementById('clear-btn');
    this.exportJSONBtn = document.getElementById('export-json');
    this.resultsSection = document.getElementById('results-section');
    this.historyContainer = document.getElementById('history-container');
    this.themeToggle = document.getElementById('theme-toggle');
    if (this.expressionInput) {
      this.expressionInput.disabled = true;
      this.expressionInput.placeholder = "La expresión lógica se generará automáticamente";
    }
  }

  initSymbolButtons() {
    const symbolButtons = document.querySelectorAll('.symbol-item');
    symbolButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const symbol = e.target.dataset.symbol || e.target.textContent;
        const targetField = this.expressionInput.disabled ? this.variableSymbolInput : this.expressionInput;
        const cursorPos = targetField.selectionStart;
        const textBefore = targetField.value.substring(0, cursorPos);
        const textAfter = targetField.value.substring(cursorPos);
        targetField.value = textBefore + symbol + textAfter;
        targetField.selectionStart = targetField.selectionEnd = cursorPos + 1;
        targetField.focus();
      });
    });
  }

  initEventListeners() {
    this.textArea.addEventListener('input', () => {
      this.updateCharCount();
      this.updateAnalyzeButtonState();
      this.updateExpressionPreview();
    });

    this.addVariableBtn.addEventListener('click', () => {
      this.addVariable();
      this.updateExpressionPreview();
    });

    this.variableSymbolInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addVariable();
        this.updateExpressionPreview();
      }
    });

    this.variableMeaningInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addVariable();
        this.updateExpressionPreview();
      }
    });

    this.analyzeBtn.addEventListener('click', () => this.performAnalysis());
    this.clearBtn.addEventListener('click', () => this.clearForm());
    this.exportJSONBtn.addEventListener('click', () => this.exportResults());
    this.themeToggle.addEventListener('click', () => this.toggleTheme());

    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        this.performAnalysis();
        e.preventDefault();
      }
    });
  }

  updateCharCount() {
    const text = this.textArea.value;
    const charCount = text.length;
    this.charCounter.textContent = `${charCount}/${this.analyzer.maxTextLength}`;
    if (charCount > this.analyzer.maxTextLength * 0.9) {
      this.charCounter.classList.add('near-limit');
    } else {
      this.charCounter.classList.remove('near-limit');
    }
  }

  addVariable() {
    const symbol = this.variableSymbolInput.value.trim();
    const meaning = this.variableMeaningInput.value.trim();

    if (!symbol || !meaning) {
      this.showError('Debe proporcionar un símbolo y un significado para la proposición.');
      return;
    }

    if (!/^[a-z]$/.test(symbol)) {
      this.showError('El símbolo debe ser una letra minúscula (a-z).');
      return;
    }

    if (this.currentVariables.some(v => v.symbol === symbol)) {
      this.showError('Este símbolo ya está en uso.');
      return;
    }

    this.currentVariables.push({ symbol, meaning });
    this.updateVariablesList();
    this.variableSymbolInput.value = '';
    this.variableMeaningInput.value = '';
    this.variableSymbolInput.focus();
  }

  updateVariablesList() {
    this.variablesList.innerHTML = '';
    this.currentVariables.forEach((variable, index) => {
      const item = document.createElement('li');
      item.className = 'variable-item';
      item.innerHTML = `
        <span class="variable-symbol">${variable.symbol}:</span>
        <span class="variable-meaning">${variable.meaning}</span>
        <button class="remove-btn" data-index="${index}" title="Eliminar">×</button>
      `;
      const removeBtn = item.querySelector('.remove-btn');
      removeBtn.addEventListener('click', () => {
        this.currentVariables.splice(index, 1);
        this.updateVariablesList();
        this.updateAnalyzeButtonState();
        this.updateExpressionPreview();
      });
      this.variablesList.appendChild(item);
    });
    this.updateAnalyzeButtonState();
  }

  updateAnalyzeButtonState() {
    const hasText = this.textArea.value.trim().length >= 10;
    const hasEnoughVariables = this.currentVariables.length >= 2;
    this.analyzeBtn.disabled = !(hasText && hasEnoughVariables);
  }

  updateExpressionPreview() {
    if (this.currentVariables.length >= 2 && this.textArea.value.trim() !== '') {
      try {
        const preview = this.analyzer.extractLogicalExpression(this.textArea.value, this.currentVariables);
        if (this.expressionInput) {
          this.expressionInput.value = preview;
        }
      } catch (e) {
        console.log("Error generating preview:", e);
        if (this.expressionInput) {
          this.expressionInput.value = "Error al generar la expresión";
        }
      }
    } else {
      if (this.expressionInput) {
        this.expressionInput.value = '';
      }
    }
  }

  performAnalysis() {
    const text = this.textArea.value.trim();
    if (!text || this.currentVariables.length < 2) {
      this.showError('Debe proporcionar un texto y al menos dos proposiciones.');
      return;
    }

    this.resultsSection.innerHTML = '<div class="loading-spinner"></div>';
    this.resultsSection.style.display = 'block';

    try {
      setTimeout(() => {
        const results = this.analyzer.analyze(text, this.currentVariables);
        if (results.error) {
          this.showError(results.error);
          return;
        }

        this.currentResults = results;
        this.storage.saveAnalysis(results);
        if (this.expressionInput) {
          this.expressionInput.value = results.expression;
        }
        this.displayResults(results);
        this.loadHistory();
        this.resultsSection.classList.add('fade-in');
      }, 300);
    } catch (error) {
      console.error('Error initiating analysis:', error);
      this.showError('No se pudo iniciar el análisis: ' + error.message);
    }
  }

  displayResults(results) {
    const html = this.analyzer.generateHTML(results);
    this.resultsSection.innerHTML = html;
    this.resultsSection.style.display = 'block';
    this.resultsSection.scrollIntoView({ behavior: 'smooth' });
  }

  showError(message) {
    this.resultsSection.innerHTML = `
      <div class="error-message">
        <i class="icon-error"></i>
        <p>${message}</p>
      </div>
    `;
    this.resultsSection.style.display = 'block';
  }

  clearForm() {
    this.textArea.value = '';
    if (this.expressionInput) {
      this.expressionInput.value = '';
    }
    this.variableSymbolInput.value = '';
    this.variableMeaningInput.value = '';
    this.currentVariables = [];
    this.updateVariablesList();
    this.updateCharCount();
    this.resultsSection.style.display = 'none';
    this.updateAnalyzeButtonState();
  }

  exportResults() {
    if (!this.currentResults) return;
    const json = this.analyzer.exportToJSON(this.currentResults);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'analisis_logico.json';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      URL.revokeObjectURL(url);
      document.body.removeChild(link);
    }, 100);
  }

  loadHistory() {
    const history = this.storage.getHistory();
    if (!this.historyContainer) return;
    if (history.length === 0) {
      this.historyContainer.innerHTML = '<p class="no-history">No hay análisis guardados.</p>';
      return;
    }

    let html = '<ul class="history-list">';
    history.forEach((entry, index) => {
      const date = new Date(entry.timestamp).toLocaleString();
      html += `
        <li class="history-item" data-index="${index}">
          <div class="history-info">
            <div class="history-date">${date}</div>
            <div class="history-expression">${entry.expression}</div>
          </div>
          <button class="history-load-btn" data-index="${index}">Cargar</button>
        </li>
      `;
    });
    html += '</ul>';
    this.historyContainer.innerHTML = html;

    const loadButtons = document.querySelectorAll('.history-load-btn');
    loadButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.loadFromHistory(index);
      });
    });
  }

  loadFromHistory(index) {
    const entry = this.storage.getAnalysis(index);
    if (!entry) return;
    this.textArea.value = entry.originalText;
    if (this.expressionInput) {
      this.expressionInput.value = entry.expression;
    }
    this.currentVariables = JSON.parse(JSON.stringify(entry.variables));
    this.updateVariablesList();
    this.updateCharCount();
    this.currentResults = entry;
    this.displayResults(entry);
    this.textArea.scrollIntoView({ behavior: 'smooth' });
  }

  toggleTheme() {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.applyTheme();
    localStorage.setItem('theme', this.currentTheme);
  }

  applyTheme() {
    document.body.className = this.currentTheme;
    this.themeToggle.innerHTML = this.currentTheme === 'light'
      ? '<i class="icon-moon"></i>'
      : '<i class="icon-sun"></i>';
  }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  const analyzer = new PropositionAnalyzer();
  const storage = new AnalysisStorage();
  const ui = new PropositionUI(analyzer, storage);
});