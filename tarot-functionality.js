/**
 * TAROTXD - Sistema de Funcionalidad de Tarot
 * Este archivo proporciona todas las funcionalidades necesarias para el sitio de tarot
 */

// ============================================================================
// CONFIGURACIÓN Y DATOS
// ============================================================================

const TarotSystem = {
  // Base de datos de cartas (se cargará desde tarot-cards-database.json)
  cardsDatabase: null,

  // Configuración de idioma
  currentLanguage: 'en',

  // Historial de lecturas
  readingHistory: [],

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================

  async init() {
    console.log('🎴 Inicializando Sistema de Tarot...');

    // Cargar base de datos de cartas
    await this.loadCardsDatabase();

    // Detectar idioma
    this.detectLanguage();

    // Inicializar funcionalidades
    this.initTarotReading();
    this.initYesNoTarot();
    this.initLoveTarot();
    this.initDailyFortune();
    this.initForms();
    this.initDrawCards();

    // Cargar historial del localStorage
    this.loadHistory();

    // Mostrar display de créditos
    this.showCreditsDisplay();

    console.log('✅ Sistema de Tarot inicializado correctamente');
  },

  // ============================================================================
  // VERIFICACIÓN DE CRÉDITOS
  // ============================================================================

  // Verificar créditos antes de hacer una lectura
  checkCreditsBeforeReading() {
    // Si el PaymentSystem no está cargado, permitir (modo gratuito)
    if (!window.PaymentSystem) {
      return true;
    }

    // Verificar si puede hacer lectura
    if (!window.PaymentSystem.canPerformReading()) {
      // Mostrar modal de pricing
      window.PaymentSystem.showPricingModal();
      return false;
    }

    // Consumir una lectura
    window.PaymentSystem.consumeReading();

    // Actualizar display de créditos
    this.updateCreditsDisplay();

    return true;
  },

  // Mostrar display de créditos
  showCreditsDisplay() {
    if (!window.PaymentSystem) return;

    let display = document.getElementById('credits-display');
    if (!display) {
      display = document.createElement('div');
      display.id = 'credits-display';
      display.className = 'credits-display';
      display.onclick = () => window.PaymentSystem.showPricingModal();
      document.body.appendChild(display);
    }

    this.updateCreditsDisplay();
  },

  // Actualizar display de créditos
  updateCreditsDisplay() {
    const display = document.getElementById('credits-display');
    if (!display || !window.PaymentSystem) return;

    const remaining = window.PaymentSystem.getRemainingReadings();
    const isUnlimited = remaining === '∞';
    const isZero = remaining === 0;

    display.className = 'credits-display';
    if (isUnlimited) display.className += ' unlimited';
    if (isZero) display.className += ' zero';

    display.innerHTML = `
      <span class="credits-icon">🎴</span>
      <span>Lecturas:</span>
      <span class="credits-count">${remaining}</span>
    `;
  },

  // Cargar base de datos de cartas
  async loadCardsDatabase() {
    try {
      const response = await fetch('/tarot-cards-database.json');
      this.cardsDatabase = await response.json();
      console.log('✅ Base de datos de cartas cargada:',
                  this.cardsDatabase.majorArcana.length + ' arcanos mayores, ' +
                  'arcanos menores completos');
    } catch (error) {
      console.error('❌ Error cargando base de datos de cartas:', error);
      // Usar datos embebidos como fallback
      this.cardsDatabase = this.getEmbeddedCards();
    }
  },

  // Detectar idioma de la página
  detectLanguage() {
    const html = document.documentElement;
    const lang = html.lang || 'en';
    this.currentLanguage = lang.split('-')[0]; // 'en-US' -> 'en'
    console.log('🌍 Idioma detectado:', this.currentLanguage);
  },

  // ============================================================================
  // FUNCIONES PRINCIPALES DE TAROT
  // ============================================================================

  // Obtener carta aleatoria
  getRandomCard(includeMinorArcana = true) {
    let allCards = [...this.cardsDatabase.majorArcana];

    if (includeMinorArcana) {
      allCards = allCards.concat(
        this.cardsDatabase.minorArcana.wands,
        this.cardsDatabase.minorArcana.cups,
        this.cardsDatabase.minorArcana.swords,
        this.cardsDatabase.minorArcana.pentacles
      );
    }

    const randomIndex = Math.floor(Math.random() * allCards.length);
    const card = allCards[randomIndex];
    const isReversed = Math.random() < 0.3; // 30% probabilidad de carta invertida

    return {
      ...card,
      isReversed,
      meaning: isReversed ? card.reversed : card.upright,
      meaningEs: isReversed ? card.reversedEs : card.uprightEs,
      displayName: this.currentLanguage === 'es' ? card.nameEs : card.name
    };
  },

  // Obtener múltiples cartas sin repetir
  getRandomCards(count, includeMinorArcana = true) {
    const cards = [];
    const usedIndices = new Set();

    let allCards = [...this.cardsDatabase.majorArcana];
    if (includeMinorArcana) {
      allCards = allCards.concat(
        this.cardsDatabase.minorArcana.wands,
        this.cardsDatabase.minorArcana.cups,
        this.cardsDatabase.minorArcana.swords,
        this.cardsDatabase.minorArcana.pentacles
      );
    }

    while (cards.length < count && usedIndices.size < allCards.length) {
      const randomIndex = Math.floor(Math.random() * allCards.length);

      if (!usedIndices.has(randomIndex)) {
        usedIndices.add(randomIndex);
        const card = allCards[randomIndex];
        const isReversed = Math.random() < 0.3;

        cards.push({
          ...card,
          isReversed,
          meaning: isReversed ? card.reversed : card.upright,
          meaningEs: isReversed ? card.reversedEs : card.uprightEs,
          displayName: this.currentLanguage === 'es' ? card.nameEs : card.name
        });
      }
    }

    return cards;
  },

  // ============================================================================
  // LECTURA DE TAROT GENERAL
  // ============================================================================

  initTarotReading() {
    // Buscar botones de inicio de lectura
    const readingButtons = document.querySelectorAll('[data-action="start-tarot-reading"]');

    readingButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.performTarotReading();
      });
    });

    console.log('🎴 Lectura de Tarot general inicializada');
  },

  performTarotReading(question = '') {
    // Verificar créditos primero
    if (!this.checkCreditsBeforeReading()) {
      console.log('⛔ Lectura cancelada: sin créditos');
      return null;
    }

    console.log('🔮 Realizando lectura de tarot...');

    // Tirada de 3 cartas: Pasado, Presente, Futuro
    const cards = this.getRandomCards(3, true);

    const reading = {
      timestamp: new Date().toISOString(),
      question: question,
      spread: 'past-present-future',
      cards: [
        { position: 'Past', card: cards[0] },
        { position: 'Present', card: cards[1] },
        { position: 'Future', card: cards[2] }
      ]
    };

    // Guardar en historial
    this.saveReading(reading);

    // Mostrar resultado
    this.displayReading(reading);

    return reading;
  },

  // ============================================================================
  // TAROT SÍ O NO
  // ============================================================================

  initYesNoTarot() {
    const yesNoButtons = document.querySelectorAll('[data-action="yes-no-tarot"]');

    yesNoButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.performYesNoReading();
      });
    });

    console.log('✅ Tarot Sí/No inicializado');
  },

  performYesNoReading(question = '') {
    // Verificar créditos primero
    if (!this.checkCreditsBeforeReading()) {
      console.log('⛔ Lectura cancelada: sin créditos');
      return null;
    }

    console.log('🔮 Realizando lectura Sí/No...');

    const card = this.getRandomCard(false); // Solo arcanos mayores

    // Lógica de Sí/No basada en la energía de la carta
    const yesCards = [0, 1, 3, 6, 10, 17, 19, 21]; // The Fool, Magician, Empress, Lovers, etc.
    const noCards = [5, 12, 13, 15, 16, 18]; // Hierophant, Hanged Man, Death, Devil, Tower, Moon

    let answer;
    if (yesCards.includes(card.id)) {
      answer = card.isReversed ? 'maybe' : 'yes';
    } else if (noCards.includes(card.id)) {
      answer = card.isReversed ? 'maybe' : 'no';
    } else {
      answer = 'maybe';
    }

    const reading = {
      timestamp: new Date().toISOString(),
      question: question,
      type: 'yes-no',
      card: card,
      answer: answer,
      answerText: this.getYesNoAnswerText(answer)
    };

    this.saveReading(reading);
    this.displayYesNoReading(reading);

    return reading;
  },

  getYesNoAnswerText(answer) {
    const texts = {
      en: {
        yes: '✅ YES - The cards show a positive outcome',
        no: '❌ NO - The cards suggest caution or reconsideration',
        maybe: '⚖️ MAYBE - The situation is uncertain, more reflection needed'
      },
      es: {
        yes: '✅ SÍ - Las cartas muestran un resultado positivo',
        no: '❌ NO - Las cartas sugieren precaución o reconsideración',
        maybe: '⚖️ TAL VEZ - La situación es incierta, se necesita más reflexión'
      }
    };

    return texts[this.currentLanguage]?.[answer] || texts.en[answer];
  },

  // ============================================================================
  // TAROT DEL AMOR
  // ============================================================================

  initLoveTarot() {
    const loveButtons = document.querySelectorAll('[data-action="love-tarot"]');

    loveButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.performLoveReading();
      });
    });

    console.log('❤️ Tarot del Amor inicializado');
  },

  performLoveReading(names = { person1: 'You', person2: 'Them' }) {
    // Verificar créditos primero
    if (!this.checkCreditsBeforeReading()) {
      console.log('⛔ Lectura cancelada: sin créditos');
      return null;
    }

    console.log('💕 Realizando lectura de amor...');

    // Tirada de amor de 5 cartas
    const cards = this.getRandomCards(5, true);

    const reading = {
      timestamp: new Date().toISOString(),
      type: 'love',
      names: names,
      spread: 'love-spread',
      cards: [
        { position: 'Current Situation', card: cards[0] },
        { position: `${names.person1}'s Feelings`, card: cards[1] },
        { position: `${names.person2}'s Feelings`, card: cards[2] },
        { position: 'Challenges', card: cards[3] },
        { position: 'Outcome', card: cards[4] }
      ]
    };

    this.saveReading(reading);
    this.displayLoveReading(reading);

    return reading;
  },

  // ============================================================================
  // FORTUNA DIARIA
  // ============================================================================

  initDailyFortune() {
    const fortuneButtons = document.querySelectorAll('[data-action="daily-fortune"]');

    fortuneButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        this.getDailyFortune();
      });
    });

    // Mostrar fortuna automáticamente si estamos en la página
    if (window.location.pathname.includes('fortune/daily')) {
      setTimeout(() => this.getDailyFortune(), 500);
    }

    console.log('🌟 Fortuna Diaria inicializada');
  },

  getDailyFortune() {
    console.log('🌟 Generando fortuna diaria...');

    // Usar la fecha como seed para que sea consistente durante el día
    const today = new Date().toDateString();
    const storedFortune = localStorage.getItem('dailyFortune');
    const storedDate = localStorage.getItem('fortuneDate');

    if (storedFortune && storedDate === today) {
      console.log('📅 Usando fortuna almacenada de hoy');
      return JSON.parse(storedFortune);
    }

    // Nueva fortuna del día
    const card = this.getRandomCard(true);

    const fortune = {
      date: today,
      card: card,
      luckyNumber: Math.floor(Math.random() * 100) + 1,
      luckyColor: this.getRandomColor(),
      advice: this.getDailyAdvice(card)
    };

    // Guardar para hoy
    localStorage.setItem('dailyFortune', JSON.stringify(fortune));
    localStorage.setItem('fortuneDate', today);

    this.displayDailyFortune(fortune);

    return fortune;
  },

  getRandomColor() {
    const colors = ['Red', 'Blue', 'Green', 'Purple', 'Gold', 'Silver', 'Orange', 'Pink'];
    return colors[Math.floor(Math.random() * colors.length)];
  },

  getDailyAdvice(card) {
    const adviceTemplates = {
      en: [
        `Today, ${card.name} suggests you focus on ${card.meaning.toLowerCase()}.`,
        `The energy of ${card.name} brings opportunities for ${card.meaning.toLowerCase()}.`,
        `${card.name} reminds you to embrace ${card.meaning.toLowerCase()}.`
      ],
      es: [
        `Hoy, ${card.nameEs} sugiere que te enfoques en ${card.meaningEs.toLowerCase()}.`,
        `La energía de ${card.nameEs} trae oportunidades para ${card.meaningEs.toLowerCase()}.`,
        `${card.nameEs} te recuerda abrazar ${card.meaningEs.toLowerCase()}.`
      ]
    };

    const templates = adviceTemplates[this.currentLanguage] || adviceTemplates.en;
    return templates[Math.floor(Math.random() * templates.length)];
  },

  // ============================================================================
  // SACAR CARTAS
  // ============================================================================

  initDrawCards() {
    const drawButtons = document.querySelectorAll('[data-action="draw-cards"]');

    drawButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        e.preventDefault();
        const count = parseInt(button.dataset.count) || 1;
        this.drawCards(count);
      });
    });

    console.log('🃏 Sistema de sacar cartas inicializado');
  },

  drawCards(count = 1) {
    // Verificar créditos primero
    if (!this.checkCreditsBeforeReading()) {
      console.log('⛔ Lectura cancelada: sin créditos');
      return null;
    }

    console.log(`🃏 Sacando ${count} carta(s)...`);

    const cards = this.getRandomCards(count, true);
    this.displayDrawnCards(cards);

    return cards;
  },

  // ============================================================================
  // FUNCIONALIDAD DE FORMULARIOS
  // ============================================================================

  initForms() {
    // Formulario de contacto
    const contactForm = document.querySelector('form[action*="contact"]');
    if (contactForm) {
      contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleContactForm(contactForm);
      });
    }

    // Formulario de feedback
    const feedbackForm = document.querySelector('form[action*="feedback"]');
    if (feedbackForm) {
      feedbackForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFeedbackForm(feedbackForm);
      });
    }

    console.log('📝 Formularios inicializados');
  },

  handleContactForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    console.log('📧 Enviando formulario de contacto:', data);

    // Simular envío
    this.showNotification('✅ Message sent successfully! We\'ll get back to you soon.', 'success');

    // Guardar en localStorage
    const contacts = JSON.parse(localStorage.getItem('contacts') || '[]');
    contacts.push({
      ...data,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('contacts', JSON.stringify(contacts));

    form.reset();
  },

  handleFeedbackForm(form) {
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);

    console.log('💬 Enviando feedback:', data);

    this.showNotification('✅ Thank you for your feedback!', 'success');

    // Guardar en localStorage
    const feedback = JSON.parse(localStorage.getItem('feedback') || '[]');
    feedback.push({
      ...data,
      timestamp: new Date().toISOString()
    });
    localStorage.setItem('feedback', JSON.stringify(feedback));

    form.reset();
  },

  // ============================================================================
  // VISUALIZACIÓN Y UI
  // ============================================================================

  displayReading(reading) {
    console.log('📊 Mostrando lectura:', reading);

    const container = document.getElementById('tarot-reading-result');
    if (!container) {
      console.warn('⚠️ Contenedor de resultados no encontrado');
      this.createResultModal(reading);
      return;
    }

    let html = '<div class="tarot-reading-display">';
    html += '<h2>🔮 Your Tarot Reading</h2>';

    reading.cards.forEach(({ position, card }) => {
      html += `
        <div class="card-result">
          <h3>${position}</h3>
          <p class="card-name">${card.displayName} ${card.isReversed ? '(Reversed)' : ''}</p>
          <p class="card-meaning">${this.currentLanguage === 'es' ? card.meaningEs : card.meaning}</p>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },

  displayYesNoReading(reading) {
    console.log('📊 Mostrando lectura Sí/No:', reading);

    const container = document.getElementById('yes-no-result');
    if (!container) {
      this.createResultModal(reading);
      return;
    }

    const html = `
      <div class="yes-no-display">
        <h2>${reading.answerText}</h2>
        <div class="card-result">
          <p class="card-name">${reading.card.displayName} ${reading.card.isReversed ? '(Reversed)' : ''}</p>
          <p class="card-meaning">${this.currentLanguage === 'es' ? reading.card.meaningEs : reading.card.meaning}</p>
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  displayLoveReading(reading) {
    console.log('📊 Mostrando lectura de amor:', reading);

    const container = document.getElementById('love-reading-result');
    if (!container) {
      this.createResultModal(reading);
      return;
    }

    let html = '<div class="love-reading-display">';
    html += '<h2>❤️ Love Tarot Reading</h2>';

    reading.cards.forEach(({ position, card }) => {
      html += `
        <div class="card-result">
          <h3>${position}</h3>
          <p class="card-name">${card.displayName} ${card.isReversed ? '(Reversed)' : ''}</p>
          <p class="card-meaning">${this.currentLanguage === 'es' ? card.meaningEs : card.meaning}</p>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },

  displayDailyFortune(fortune) {
    console.log('📊 Mostrando fortuna diaria:', fortune);

    const container = document.getElementById('daily-fortune-result');
    if (!container) {
      this.createResultModal(fortune);
      return;
    }

    const html = `
      <div class="fortune-display">
        <h2>🌟 Your Daily Fortune</h2>
        <div class="fortune-card">
          <p class="card-name">${fortune.card.displayName} ${fortune.card.isReversed ? '(Reversed)' : ''}</p>
          <p class="card-meaning">${this.currentLanguage === 'es' ? fortune.card.meaningEs : fortune.card.meaning}</p>
        </div>
        <div class="fortune-details">
          <p><strong>🍀 Lucky Number:</strong> ${fortune.luckyNumber}</p>
          <p><strong>🎨 Lucky Color:</strong> ${fortune.luckyColor}</p>
          <p><strong>💡 Advice:</strong> ${fortune.advice}</p>
        </div>
      </div>
    `;

    container.innerHTML = html;
  },

  displayDrawnCards(cards) {
    console.log('📊 Mostrando cartas sacadas:', cards);

    const container = document.getElementById('drawn-cards-result');
    if (!container) {
      this.createResultModal(cards);
      return;
    }

    let html = '<div class="drawn-cards-display">';
    html += '<h2>🃏 Your Drawn Cards</h2>';

    cards.forEach((card, index) => {
      html += `
        <div class="card-result">
          <h3>Card ${index + 1}</h3>
          <p class="card-name">${card.displayName} ${card.isReversed ? '(Reversed)' : ''}</p>
          <p class="card-meaning">${this.currentLanguage === 'es' ? card.meaningEs : card.meaning}</p>
        </div>
      `;
    });

    html += '</div>';
    container.innerHTML = html;
  },

  createResultModal(data) {
    // Crear modal si no hay contenedor específico
    console.log('🪟 Creando modal de resultados');

    // Mostrar notificación por ahora
    this.showNotification('✅ Reading complete! Check console for details.', 'success');
    console.log('📊 Resultado completo:', data);
  },

  showNotification(message, type = 'info') {
    console.log(`🔔 ${type.toUpperCase()}: ${message}`);

    // Crear notificación visual
    const notification = document.createElement('div');
    notification.className = `tarot-notification ${type}`;
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : '#2196F3'};
      color: white;
      padding: 16px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      z-index: 10000;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  },

  // ============================================================================
  // HISTORIAL Y ALMACENAMIENTO
  // ============================================================================

  saveReading(reading) {
    this.readingHistory.push(reading);

    // Guardar en localStorage
    const history = JSON.parse(localStorage.getItem('tarotHistory') || '[]');
    history.push(reading);

    // Mantener solo las últimas 50 lecturas
    if (history.length > 50) {
      history.shift();
    }

    localStorage.setItem('tarotHistory', JSON.stringify(history));
    console.log('💾 Lectura guardada en historial');
  },

  loadHistory() {
    const history = JSON.parse(localStorage.getItem('tarotHistory') || '[]');
    this.readingHistory = history;
    console.log(`📚 Historial cargado: ${history.length} lecturas`);
  },

  getHistory() {
    return this.readingHistory;
  },

  clearHistory() {
    this.readingHistory = [];
    localStorage.removeItem('tarotHistory');
    console.log('🗑️ Historial limpiado');
  },

  // ============================================================================
  // DATOS EMBEBIDOS (FALLBACK)
  // ============================================================================

  getEmbeddedCards() {
    // Versión reducida embebida en caso de que falle la carga del JSON
    return {
      majorArcana: [
        { id: 0, name: "The Fool", nameEs: "El Loco", upright: "New beginnings", reversed: "Recklessness", uprightEs: "Nuevos comienzos", reversedEs: "Imprudencia" },
        { id: 1, name: "The Magician", nameEs: "El Mago", upright: "Manifestation", reversed: "Manipulation", uprightEs: "Manifestación", reversedEs: "Manipulación" },
        // ... otros arcanos (versión simplificada)
      ],
      minorArcana: {
        wands: [],
        cups: [],
        swords: [],
        pentacles: []
      }
    };
  }
};

// ============================================================================
// AUTO-INICIALIZACIÓN
// ============================================================================

// Inicializar cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => TarotSystem.init());
} else {
  TarotSystem.init();
}

// Exponer globalmente para uso en consola
window.TarotSystem = TarotSystem;

console.log('🎴 Módulo de Tarot cargado. Use window.TarotSystem para acceder a las funcionalidades.');
