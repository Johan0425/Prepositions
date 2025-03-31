// analyzer.js - Core logic for proposition analysis

/**
 * Analyzes logical propositions and evaluates their truth value
 * @class PropositionAnalyzer
 */
class PropositionAnalyzer {
    /**
     * Creates an instance of PropositionAnalyzer
     * @param {Object} options - Configuration options
     */
    constructor(options = {}) {
      this.maxPropositions = options.maxPropositions || 20;
      this.symbols = new Map([
        ['∧', 'AND'],
        ['∨', 'OR'],
        ['¬', 'NOT'],
        ['→', 'IMPLIES'],
        ['↔', 'IFF'],
        ['⊤', 'TRUE'],
        ['⊥', 'FALSE']
      ]);
      
      // Proposition variable meanings
      this.variableMeanings = new Map();
    }
  
    /**
     * Validates input text meets minimum requirements
     * @param {string} text - Text to validate
     * @returns {Object} Validation result with status and message
     */
    validateInput(text) {
      if (!text || text.trim() === '') {
        return { valid: false, message: 'El texto no puede estar vacío.' };
      }
      
      if (text.length < 10) {
        return { valid: false, message: 'El texto debe tener al menos 10 caracteres.' };
      }
      
      if (text.length > 1000) {
        return { valid: false, message: 'El texto no debe exceder los 1000 caracteres.' };
      }
      
      return { valid: true };
    }
  
    /**
     * Validates proposition variables
     * @param {Array} variables - Array of proposition variables
     * @returns {Object} Validation result with status and message
     */
    validatePropositionVariables(variables) {
      if (!variables || variables.length === 0) {
        return { valid: false, message: 'Debe proporcionar al menos una proposición.' };
      }
      
      if (variables.length > this.maxPropositions) {
        return { valid: false, message: `No puede exceder el máximo de ${this.maxPropositions} proposiciones.` };
      }
      
      // Check for duplicate variables
      const uniqueVars = new Set(variables.map(v => v.symbol));
      if (uniqueVars.size !== variables.length) {
        return { valid: false, message: 'No puede haber símbolos de proposición duplicados.' };
      }
      
      // Check for valid variable symbols (single letters)
      const invalidVars = variables.filter(v => !/^[a-z]$/.test(v.symbol));
      if (invalidVars.length > 0) {
        return { valid: false, message: 'Los símbolos de proposición deben ser letras minúsculas individuales.' };
      }
      
      return { valid: true };
    }
  
    /**
     * Parses and validates a logical expression
     * @param {string} expression - Logical expression to validate
     * @returns {Object} Validation result with status and AST if valid
     */
    parseExpression(expression) {
      try {
        // Basic validation
        if (!expression || expression.trim() === '') {
          return { valid: false, message: 'La expresión lógica no puede estar vacía.' };
        }
        
        // Check for balanced parentheses
        const stack = [];
        for (let i = 0; i < expression.length; i++) {
          if (expression[i] === '(') {
            stack.push('(');
          } else if (expression[i] === ')') {
            if (stack.length === 0) {
              return { valid: false, message: 'Paréntesis no balanceados en la expresión.' };
            }
            stack.pop();
          }
        }
        
        if (stack.length > 0) {
          return { valid: false, message: 'Paréntesis no balanceados en la expresión.' };
        }
        
        // This is a simplified parser - in a real system, you'd use a proper parser
        // to build an Abstract Syntax Tree (AST)
        const ast = this.buildAST(expression);
        
        return { valid: true, ast };
      } catch (error) {
        return { valid: false, message: `Error al analizar la expresión: ${error.message}` };
      }
    }
  
    /**
     * Builds an Abstract Syntax Tree from a logical expression
     * @param {string} expression - Logical expression
     * @returns {Object} AST representing the expression
     */
    buildAST(expression) {
      // This is a placeholder for a proper parser
      // In a real system, you'd implement a parser that handles precedence and associations
      // For now, we'll just return a simple object representing the expression
      return {
        type: 'expression',
        value: expression,
        // This would normally contain a proper tree structure
      };
    }
  
    /**
     * Evaluates a logical expression with given variable values
     * @param {Object} ast - Abstract Syntax Tree of expression
     * @param {Object} variableValues - Map of variable values
     * @returns {boolean} Result of evaluation
     */
    evaluateExpression(ast, variableValues) {
      // This is a placeholder for a proper evaluator
      // In a real system, you'd implement a recursive evaluator that traverses the AST
      // For demonstration, we'll use a simple eval-based approach
      // (NOT recommended for production due to security concerns)
      
      // Convert the expression to JavaScript
      let jsExpression = ast.value
        .replace(/∧/g, '&&')
        .replace(/∨/g, '||')
        .replace(/¬/g, '!')
        .replace(/→/g, '<=')
        .replace(/↔/g, '==');
      
      // Replace variable symbols with their values
      for (const [symbol, value] of Object.entries(variableValues)) {
        const regex = new RegExp(`\\b${symbol}\\b`, 'g');
        jsExpression = jsExpression.replace(regex, value ? 'true' : 'false');
      }
      
      // Evaluate (simplified example - not secure for production)
      try {
        // This is a simplified demonstration
        // eslint-disable-next-line no-new-func
        return new Function(`return ${jsExpression}`)();
      } catch (error) {
        console.error('Error evaluating expression:', error);
        return false;
      }
    }
  
    /**
     * Generates a truth table for a given expression
     * @param {Object} ast - Abstract Syntax Tree of expression
     * @param {Array} variables - Array of variable symbols
     * @returns {Array} Truth table
     */
    generateTruthTable(ast, variables) {
      const variableSymbols = variables.map(v => v.symbol);
      const rows = [];
      
      // Generate all possible combinations of variable values
      const combinations = this.generateCombinations(variableSymbols.length);
      
      for (const combination of combinations) {
        const variableValues = {};
        
        // Assign values to variables
        for (let i = 0; i < variableSymbols.length; i++) {
          variableValues[variableSymbols[i]] = combination[i];
        }
        
        // Evaluate expression
        const result = this.evaluateExpression(ast, variableValues);
        
        // Create row
        const row = {
          values: variableValues,
          result
        };
        
        rows.push(row);
      }
      
      return rows;
    }
  
    /**
     * Generates all possible combinations of boolean values
     * @param {number} n - Number of variables
     * @returns {Array} Array of combinations
     */
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
  
    /**
     * Analyzes the input text to extract logical propositions
     * @param {string} text - Input text
     * @param {Array} variables - Array of proposition variables
     * @param {string} expression - Logical expression to analyze
     * @returns {Object} Analysis results
     */
    analyze(text, variables, expression) {
      // Validate inputs
      const textValidation = this.validateInput(text);
      if (!textValidation.valid) {
        return { error: textValidation.message };
      }
      
      const variablesValidation = this.validatePropositionVariables(variables);
      if (!variablesValidation.valid) {
        return { error: variablesValidation.message };
      }
      
      const expressionValidation = this.parseExpression(expression);
      if (!expressionValidation.valid) {
        return { error: expressionValidation.message };
      }
      
      // Store variable meanings
      this.variableMeanings.clear();
      variables.forEach(v => {
        this.variableMeanings.set(v.symbol, v.meaning);
      });
      
      // Generate truth table
      const truthTable = this.generateTruthTable(expressionValidation.ast, variables);
      
      // Determine if the expression is a tautology, contradiction, or contingency
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
      
      // Return analysis results
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
  
    /**
     * Converts a logical expression to natural language
     * @param {string} expression - Logical expression
     * @returns {string} Natural language representation
     */
    expressionToNaturalLanguage(expression) {
      let natural = expression;
      
      // Replace operators with natural language
      natural = natural
        .replace(/∧/g, ' y ')
        .replace(/∨/g, ' o ')
        .replace(/¬/g, 'no ')
        .replace(/→/g, ' implica ')
        .replace(/↔/g, ' si y solo si ');
      
      // Replace variable symbols with their meanings
      for (const [symbol, meaning] of this.variableMeanings.entries()) {
        const regex = new RegExp(`\\b${symbol}\\b`, 'g');
        natural = natural.replace(regex, `"${meaning}"`);
      }
      
      return natural;
    }
  
    /**
     * Formats the result as HTML
     * @param {Object} results - Analysis results
     * @returns {string} HTML representation
     */
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
      
      // Add table headers
      results.variables.forEach(v => {
        html += `<th>${v.symbol}</th>`;
      });
      
      html += `
                  <th>${results.expression}</th>
                </tr>
              </thead>
              <tbody>
      `;
      
      // Add table rows
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
  
    /**
     * Exports results to JSON
     * @param {Object} results - Analysis results
     * @returns {string} JSON representation
     */
    exportToJSON(results) {
      return JSON.stringify(results, null, 2);
    }
  }
  
  // storage.js - Handles local storage operations
  
  /**
   * Manages storage of analysis history
   * @class AnalysisStorage
   */
  class AnalysisStorage {
    /**
     * Creates a new storage manager instance
     * @param {number} maxEntries - Maximum number of entries to store
     */
    constructor(maxEntries = 10) {
      this.storageKey = 'logical-proposition-analysis-history';
      this.maxEntries = maxEntries;
    }
    
    /**
     * Saves analysis results to localStorage
     * @param {Object} results - Analysis results to save
     */
    saveAnalysis(results) {
      try {
        // Get existing history
        const history = this.getHistory();
        
        // Add to beginning of array
        history.unshift(results);
        
        // Limit to max entries
        if (history.length > this.maxEntries) {
          history.pop();
        }
        
        // Save back to localStorage
        localStorage.setItem(this.storageKey, JSON.stringify(history));
        
        return true;
      } catch (error) {
        console.error('Error saving analysis:', error);
        return false;
      }
    }
    
    /**
     * Retrieves analysis history from localStorage
     * @returns {Array} Analysis history
     */
    getHistory() {
      try {
        const history = localStorage.getItem(this.storageKey);
        return history ? JSON.parse(history) : [];
      } catch (error) {
        console.error('Error retrieving history:', error);
        return [];
      }
    }
    
    /**
     * Clears analysis history
     */
    clearHistory() {
      localStorage.removeItem(this.storageKey);
    }
    
    /**
     * Gets a specific analysis from history
     * @param {number} index - Index of analysis to retrieve
     * @returns {Object} Analysis results
     */
    getAnalysis(index) {
      const history = this.getHistory();
      return history[index] || null;
    }
  }
  
  // ui.js - Handles user interface interactions
  
  /**
   * Manages the application user interface
   * @class PropositionUI
   */
  class PropositionUI {
    /**
     * Creates a new UI manager instance
     * @param {PropositionAnalyzer} analyzer - Analyzer instance
     * @param {AnalysisStorage} storage - Storage instance
     */
    constructor(analyzer, storage) {
      this.analyzer = analyzer;
      this.storage = storage;
      this.currentVariables = [];
      this.currentResults = null;
      
      // Theme management
      this.currentTheme = localStorage.getItem('theme') || 'light';
      
      this.initElements();
      this.initEventListeners();
      this.loadHistory();
      this.applyTheme();
      this.updateCharCount();
    }
    
    /**
     * Initialize UI elements
     */
    initElements() {
      // Text input elements
      this.textArea = document.getElementById('text-input');
      this.expressionInput = document.getElementById('expression-input');
      this.charCounter = document.getElementById('char-counter');
      
      // Variable management elements
      this.variableSymbolInput = document.getElementById('variable-symbol');
      this.variableMeaningInput = document.getElementById('variable-meaning');
      this.addVariableBtn = document.getElementById('add-variable-btn');
      this.variablesList = document.getElementById('variables-list');
      
      // Action buttons
      this.analyzeBtn = document.getElementById('analyze-btn');
      this.clearBtn = document.getElementById('clear-btn');
      this.exportJSONBtn = document.getElementById('export-json');
      
      // Result display elements
      this.resultsSection = document.getElementById('results-section');
      this.historyContainer = document.getElementById('history-container');
      
      // Theme toggle
      this.themeToggle = document.getElementById('theme-toggle');
    }
    
    /**
     * Initialize all event listeners
     */
    initEventListeners() {
      // Text input events
      this.textArea.addEventListener('input', () => this.updateCharCount());
      
      // Variable management events
      this.addVariableBtn.addEventListener('click', () => this.addVariable());
      this.variableSymbolInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.addVariable();
      });
      this.variableMeaningInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') this.addVariable();
      });
      
      // Action button events
      this.analyzeBtn.addEventListener('click', () => this.performAnalysis());
      this.clearBtn.addEventListener('click', () => this.clearForm());
      this.exportJSONBtn.addEventListener('click', () => this.exportResults());
      
      // Theme toggle
      this.themeToggle.addEventListener('click', () => this.toggleTheme());
      
      // Add keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        // Ctrl+Enter to analyze
        if (e.ctrlKey && e.key === 'Enter') {
          this.performAnalysis();
          e.preventDefault();
        }
      });
    }
    
    /**
     * Updates the character counter for text input
     */
    updateCharCount() {
      const text = this.textArea.value;
      const charCount = text.length;
      this.charCounter.textContent = `${charCount}/1000`;
      
      // Change color when approaching limit
      if (charCount > 900) {
        this.charCounter.classList.add('near-limit');
      } else {
        this.charCounter.classList.remove('near-limit');
      }
    }
    
    /**
     * Adds a new variable to the list
     */
    addVariable() {
      const symbol = this.variableSymbolInput.value.trim().toLowerCase();
      const meaning = this.variableMeaningInput.value.trim();
      
      if (!symbol || !meaning) {
        this.showError('Debe proporcionar un símbolo y un significado para la proposición.');
        return;
      }
      
      if (!/^[a-z]$/.test(symbol)) {
        this.showError('El símbolo de la proposición debe ser una letra minúscula.');
        return;
      }
      
      if (this.currentVariables.some(v => v.symbol === symbol)) {
        this.showError('Este símbolo ya está en uso.');
        return;
      }
      
      // Add variable to list
      this.currentVariables.push({ symbol, meaning });
      
      // Update UI
      this.updateVariablesList();
      
      // Clear inputs
      this.variableSymbolInput.value = '';
      this.variableMeaningInput.value = '';
      this.variableSymbolInput.focus();
    }
    
    /**
     * Updates the variables list in the UI
     */
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
        
        // Add remove button listener
        const removeBtn = item.querySelector('.remove-btn');
        removeBtn.addEventListener('click', () => {
          this.currentVariables.splice(index, 1);
          this.updateVariablesList();
        });
        
        this.variablesList.appendChild(item);
      });
      
      // Update analyze button state
      this.updateAnalyzeButtonState();
    }
    
    /**
     * Updates the analyze button state based on inputs
     */
    updateAnalyzeButtonState() {
      const hasText = this.textArea.value.trim().length >= 10;
      const hasVariables = this.currentVariables.length > 0;
      const hasExpression = this.expressionInput.value.trim().length > 0;
      
      this.analyzeBtn.disabled = !(hasText && hasVariables && hasExpression);
    }
    
    /**
     * Performs the analysis
     */
    performAnalysis() {
      const text = this.textArea.value.trim();
      const expression = this.expressionInput.value.trim();
      
      if (!text || !expression || this.currentVariables.length === 0) {
        this.showError('Debe proporcionar un texto, variables y una expresión lógica.');
        return;
      }
      
      // Show loading state
      this.resultsSection.innerHTML = '<div class="loading-spinner"></div>';
      this.resultsSection.style.display = 'block';
      
      // Perform analysis
      setTimeout(() => {
        const results = this.analyzer.analyze(text, this.currentVariables, expression);
        
        if (results.error) {
          this.showError(results.error);
          return;
        }
        
        // Save results
        this.currentResults = results;
        this.storage.saveAnalysis(results);
        
        // Display results
        this.displayResults(results);
        
        // Refresh history
        this.loadHistory();
        
        // Animate results appearance
        this.resultsSection.classList.add('fade-in');
        setTimeout(() => {
          this.resultsSection.classList.remove('fade-in');
        }, 500);
      }, 300);
    }
    
    /**
     * Displays analysis results in the UI
     * @param {Object} results - Analysis results
     */
    displayResults(results) {
      const html = this.analyzer.generateHTML(results);
      this.resultsSection.innerHTML = html;
      this.resultsSection.style.display = 'block';
      
      // Add event listeners to result elements
      this.addResultEventListeners();
    }
    
    /**
     * Adds event listeners to result elements
     */
    addResultEventListeners() {
      // Add any additional event listeners to result elements
    }
    
    /**
     * Shows error message
     * @param {string} message - Error message to display
     */
    showError(message) {
      this.resultsSection.innerHTML = `
        <div class="error-message">
          <i class="icon-error"></i>
          <p>${message}</p>
        </div>
      `;
      this.resultsSection.style.display = 'block';
    }
    
    /**
     * Clears the form
     */
    clearForm() {
      this.textArea.value = '';
      this.expressionInput.value = '';
      this.variableSymbolInput.value = '';
      this.variableMeaningInput.value = '';
      this.currentVariables = [];
      this.updateVariablesList();
      this.updateCharCount();
      this.resultsSection.style.display = 'none';
    }
    
    /**
     * Exports results to JSON
     */
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
      
      // Clean up
      setTimeout(() => {
        URL.revokeObjectURL(url);
        document.body.removeChild(link);
      }, 100);
    }
    
    /**
     * Loads and displays analysis history
     */
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
      
      // Add event listeners to history items
      const loadButtons = document.querySelectorAll('.history-load-btn');
      loadButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const index = parseInt(e.target.dataset.index);
          this.loadFromHistory(index);
        });
      });
    }
    
    /**
     * Loads analysis from history
     * @param {number} index - History entry index
     */
    loadFromHistory(index) {
      const entry = this.storage.getAnalysis(index);
      if (!entry) return;
      
      // Load data
      this.textArea.value = entry.originalText;
      this.expressionInput.value = entry.expression;
      this.currentVariables = entry.variables;
      this.currentResults = entry;
      
      // Update UI
      this.updateVariablesList();
      this.updateCharCount();
      this.displayResults(entry);
      
      // Scroll to results
      this.resultsSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    /**
     * Toggles between light and dark themes
     */
    toggleTheme() {
      this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
      this.applyTheme();
      localStorage.setItem('theme', this.currentTheme);
    }
    
    /**
     * Applies current theme to document
     */
    applyTheme() {
      document.body.classList.remove('light-theme', 'dark-theme');
      document.body.classList.add(`${this.currentTheme}-theme`);
      
      // Update toggle icon
      if (this.themeToggle) {
        if (this.currentTheme === 'dark') {
          this.themeToggle.innerHTML = '<i class="icon-sun"></i>';
          this.themeToggle.title = 'Cambiar a tema claro';
        } else {
          this.themeToggle.innerHTML = '<i class="icon-moon"></i>';
          this.themeToggle.title = 'Cambiar a tema oscuro';
        }
      }
    }
  }
  
  // Main app initialization
  document.addEventListener('DOMContentLoaded', () => {
    // Create analyzer instance
    const analyzer = new PropositionAnalyzer({
      maxPropositions: 20
    });
    
    // Create storage instance
    const storage = new AnalysisStorage(10);
    
    // Create UI instance
    const ui = new PropositionUI(analyzer, storage);
    
    // Make instances available globally for testing
    window.logicApp = {
      analyzer,
      storage,
      ui
    };
    
    // Test function for the example
    window.testExample = () => {
      // Example from the problem statement
      const text = "Si tuvieran que justificarse ciertos hechos por su enorme tradición entonces, si estos hechos son inofensivos y respetan a todo ser viviente y al medio ambiente, no habría ningún problema. Pero si los hechos son bárbaros o no respetuosos con los seres vivientes o el medio ambiente, entonces habría que dejar de justificarlos o no podríamos considerarnos dignos de nuestro tiempo.";
      
      const variables = [
        { symbol: 'p', meaning: 'justificar hechos por su tradición' },
        { symbol: 'q', meaning: 'ser inofensivo' },
        { symbol: 'r', meaning: 'ser respetuoso con los seres vivos' },
        { symbol: 's', meaning: 'ser respetuoso con el medio ambiente' },
        { symbol: 't', meaning: 'tener problemas' },
        { symbol: 'u', meaning: 'ser digno de nuestro tiempo' }
      ];
      
      const expression = 'p → ((q ∧ r ∧ s) → ¬t) ∧ ((¬q ∨ ¬r ∨ ¬s) → (¬p ∨ ¬u))';
      
      const results = analyzer.analyze(text, variables, expression);
      
      if (results.error) {
        console.error('Test failed:', results.error);
        return false;
      }
      
      console.log('Test results:', results);
      return results;
    };
  });