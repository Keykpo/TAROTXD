/**
 * TAROTXD - Sistema de Pagos y Créditos con PayPal
 *
 * Precios:
 * - Primera tirada: GRATIS
 * - Pack de 5 tiradas: $1.49 USD
 * - Suscripción mensual: $5.00 USD (tiradas ilimitadas)
 */

const PaymentSystem = {
  // Configuración de PayPal
  paypalClientId: 'ATYgo5oZHtYp6IZRno5MNDmOzjlPxeQw3Xu5XNpyAbYLZEL0mBStXxKJPl03oViiBRouuDmIkVs7XAQO',

  // Precios
  pricing: {
    freeReadings: 1,          // Primera tirada gratis
    packPrice: 1.49,          // Pack de 5 tiradas
    packReadings: 5,
    subscriptionPrice: 5.00,  // Suscripción mensual
    subscriptionId: 'FVGHY9MV7N8MC' // ID del plan de suscripción de PayPal
  },

  // Estado del usuario
  userState: {
    remainingReadings: 1,     // Empieza con 1 lectura gratis
    isSubscribed: false,
    subscriptionExpiry: null,
    totalReadings: 0,
    purchaseHistory: []
  },

  // ============================================================================
  // INICIALIZACIÓN
  // ============================================================================

  async init() {
    console.log('💳 Initializing PayPal Payment System...');

    // Cargar estado del usuario
    this.loadUserState();

    // Cargar PayPal SDK
    await this.loadPayPalSDK();

    // Verificar estado de suscripción
    this.checkSubscriptionStatus();

    console.log('✅ Payment system initialized');
    console.log('💰 Available credits:', this.getRemainingReadings());
  },

  // Cargar PayPal SDK dinámicamente
  async loadPayPalSDK() {
    // Si ya está cargado, no hacer nada
    if (window.paypal) {
      console.log('✅ PayPal SDK already loaded');
      return;
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.paypal.com/sdk/js?client-id=${this.paypalClientId}&vault=true&intent=subscription&currency=USD`;
      script.async = true;

      script.onload = () => {
        console.log('✅ PayPal SDK loaded successfully');
        resolve();
      };

      script.onerror = () => {
        console.error('❌ Error cargando PayPal SDK');
        reject(new Error('PayPal SDK failed to load'));
      };

      document.head.appendChild(script);
    });
  },

  // ============================================================================
  // GESTIÓN DE CRÉDITOS
  // ============================================================================

  // Verificar si el usuario puede hacer una lectura
  canPerformReading() {
    // Si está suscrito y la suscripción está activa
    if (this.userState.isSubscribed && this.isSubscriptionActive()) {
      return true;
    }

    // Si tiene créditos disponibles
    return this.userState.remainingReadings > 0;
  },

  // Obtener lecturas restantes
  getRemainingReadings() {
    if (this.userState.isSubscribed && this.isSubscriptionActive()) {
      return '∞'; // Ilimitadas
    }
    return this.userState.remainingReadings;
  },

  // Consumir una lectura
  consumeReading() {
    if (this.userState.isSubscribed && this.isSubscriptionActive()) {
      // Suscriptores tienen lecturas ilimitadas
      this.userState.totalReadings++;
      this.saveUserState();
      return true;
    }

    if (this.userState.remainingReadings > 0) {
      this.userState.remainingReadings--;
      this.userState.totalReadings++;
      this.saveUserState();
      console.log(`📊 Remaining readings: ${this.userState.remainingReadings}`);
      return true;
    }

    return false;
  },

  // Agregar créditos (después de compra)
  addReadings(count) {
    this.userState.remainingReadings += count;
    this.saveUserState();
    console.log(`✅ Se agregaron ${count} lecturas. Total: ${this.userState.remainingReadings}`);
  },

  // Verificar si la suscripción está activa
  isSubscriptionActive() {
    if (!this.userState.isSubscribed || !this.userState.subscriptionExpiry) {
      return false;
    }

    const now = new Date();
    const expiry = new Date(this.userState.subscriptionExpiry);
    return now < expiry;
  },

  // Verificar estado de suscripción
  checkSubscriptionStatus() {
    if (this.userState.isSubscribed && !this.isSubscriptionActive()) {
      console.log('⚠️ Subscription expired');
      this.userState.isSubscribed = false;
      this.userState.subscriptionExpiry = null;
      this.saveUserState();
    }
  },

  // ============================================================================
  // PAYPAL - COMPRA DE PACK (5 TIRADAS)
  // ============================================================================

  async initPackPurchase(containerId = 'paypal-pack-button') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('❌ Contenedor de botón PayPal no encontrado:', containerId);
      return;
    }

    // Limpiar contenedor
    container.innerHTML = '';

    try {
      window.paypal.Buttons({
        // Crear orden
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{
              description: 'Pack de 5 Lecturas de Tarot',
              amount: {
                currency_code: 'USD',
                value: this.pricing.packPrice.toFixed(2)
              }
            }]
          });
        },

        // Cuando se aprueba el pago
        onApprove: async (data, actions) => {
          const order = await actions.order.capture();
          console.log('✅ Payment approved:', order);

          // Agregar créditos
          this.addReadings(this.pricing.packReadings);

          // Guardar en historial
          this.userState.purchaseHistory.push({
            type: 'pack',
            amount: this.pricing.packPrice,
            readings: this.pricing.packReadings,
            date: new Date().toISOString(),
            orderId: order.id
          });
          this.saveUserState();

          // Mostrar confirmación
          this.showSuccessMessage(
            '✅ ¡Pago Exitoso!',
            `Se han agregado ${this.pricing.packReadings} lecturas a tu cuenta.`
          );

          // Cerrar modal de pricing si está abierto
          this.closeAllModals();

          return order;
        },

        // Si hay error
        onError: (err) => {
          console.error('❌ Error en el pago:', err);
          this.showErrorMessage(
            '❌ Error en el Pago',
            'Hubo un problema procesando tu pago. Por favor intenta de nuevo.'
          );
        },

        // Si se cancela
        onCancel: () => {
          console.log('⚠️ Payment cancelled by user');
          this.showInfoMessage(
            'ℹ️ Pago Cancelado',
            'Has cancelado el proceso de pago.'
          );
        }
      }).render(`#${containerId}`);

      console.log('✅ PayPal button (pack) rendered');
    } catch (error) {
      console.error('❌ Error inicializando botón de PayPal:', error);
    }
  },

  // ============================================================================
  // PAYPAL - SUSCRIPCIÓN
  // ============================================================================

  async initSubscription(containerId = 'paypal-subscription-button') {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error('❌ Contenedor de botón PayPal no encontrado:', containerId);
      return;
    }

    // Limpiar contenedor
    container.innerHTML = '';

    try {
      window.paypal.Buttons({
        style: {
          shape: 'pill',
          color: 'gold',
          layout: 'vertical',
          label: 'subscribe'
        },

        // Crear suscripción
        createSubscription: (data, actions) => {
          return actions.subscription.create({
            plan_id: this.pricing.subscriptionId
          });
        },

        // Cuando se aprueba
        onApprove: async (data, actions) => {
          console.log('✅ Subscription approved:', data);

          // Activar suscripción
          this.userState.isSubscribed = true;
          this.userState.subscriptionExpiry = this.getNextMonthDate();

          // Guardar en historial
          this.userState.purchaseHistory.push({
            type: 'subscription',
            amount: this.pricing.subscriptionPrice,
            date: new Date().toISOString(),
            subscriptionId: data.subscriptionID
          });

          this.saveUserState();

          // Mostrar confirmación
          this.showSuccessMessage(
            '✅ ¡Suscripción Activada!',
            'Ahora tienes lecturas ilimitadas durante todo el mes.'
          );

          // Cerrar modal
          this.closeAllModals();

          return data;
        },

        // Si hay error
        onError: (err) => {
          console.error('❌ Error en la suscripción:', err);
          this.showErrorMessage(
            '❌ Error en la Suscripción',
            'Hubo un problema procesando tu suscripción. Por favor intenta de nuevo.'
          );
        },

        // Si se cancela
        onCancel: () => {
          console.log('⚠️ Subscription cancelled by user');
          this.showInfoMessage(
            'ℹ️ Suscripción Cancelada',
            'Has cancelado el proceso de suscripción.'
          );
        }
      }).render(`#${containerId}`);

      console.log('✅ PayPal button (subscription) rendered');
    } catch (error) {
      console.error('❌ Error inicializando botón de suscripción:', error);
    }
  },

  // Obtener fecha del próximo mes
  getNextMonthDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return date.toISOString();
  },

  // ============================================================================
  // UI - MODALES Y MENSAJES
  // ============================================================================

  // Mostrar modal de pricing
  showPricingModal() {
    // Verificar si ya existe
    let modal = document.getElementById('tarot-pricing-modal');

    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'tarot-pricing-modal';
      modal.className = 'tarot-modal';
      document.body.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="tarot-modal-content pricing-modal">
        <button class="tarot-modal-close" onclick="PaymentSystem.closeAllModals()">&times;</button>

        <h2 style="text-align: center; margin-bottom: 10px;">🎴 Continue Your Readings</h2>
        <p style="text-align: center; color: #666; margin-bottom: 30px;">
          You've used your free reading. Purchase more readings to continue:
        </p>

        <div class="pricing-grid" style="max-width: 400px; margin: 0 auto;">
          <!-- Pack of 5 Readings -->
          <div class="pricing-card featured" style="transform: none;">
            <div class="pricing-badge">BEST VALUE</div>
            <h3>Pack of 5 Readings</h3>
            <div class="pricing-price">
              <span class="currency">$</span>
              <span class="amount">1.49</span>
              <span class="period">USD</span>
            </div>
            <ul class="pricing-features">
              <li>✅ 5 tarot readings</li>
              <li>✅ All reading types</li>
              <li>✅ Never expires</li>
              <li>✅ History saved</li>
              <li>✅ Use anytime</li>
            </ul>
            <div id="paypal-pack-button" class="paypal-button-container"></div>
          </div>
        </div>

        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          <p style="color: #999; font-size: 14px;">
            🔒 Secure payment processed by PayPal<br>
            💳 No registration required, just PayPal
          </p>
        </div>
      </div>
    `;

    modal.style.display = 'flex';

    // Inicializar botón de PayPal para pack después de un pequeño delay
    setTimeout(() => {
      this.initPackPurchase();
      // Suscripciones desactivadas temporalmente
      // this.initSubscription();
    }, 300);
  },

  // Cerrar todos los modales
  closeAllModals() {
    const modals = document.querySelectorAll('.tarot-modal');
    modals.forEach(modal => {
      modal.style.display = 'none';
    });
  },

  // Mostrar mensaje de éxito
  showSuccessMessage(title, message) {
    this.showNotification(title, message, 'success');
  },

  // Mostrar mensaje de error
  showErrorMessage(title, message) {
    this.showNotification(title, message, 'error');
  },

  // Mostrar mensaje informativo
  showInfoMessage(title, message) {
    this.showNotification(title, message, 'info');
  },

  // Sistema de notificaciones
  showNotification(title, message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `tarot-notification ${type} payment-notification`;
    notification.innerHTML = `
      <strong>${title}</strong><br>
      ${message}
    `;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
      color: white;
      padding: 20px 24px;
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      z-index: 10001;
      max-width: 350px;
      animation: slideIn 0.3s ease;
    `;

    document.body.appendChild(notification);

    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  },

  // ============================================================================
  // GESTIÓN DE ESTADO
  // ============================================================================

  // Cargar estado del usuario
  loadUserState() {
    const saved = localStorage.getItem('tarotPaymentState');
    if (saved) {
      this.userState = { ...this.userState, ...JSON.parse(saved) };
      console.log('📂 Payment state loaded:', this.userState);
    }
  },

  // Guardar estado del usuario
  saveUserState() {
    localStorage.setItem('tarotPaymentState', JSON.stringify(this.userState));
    console.log('💾 Payment state saved');
  },

  // Resetear estado (para pruebas)
  resetUserState() {
    this.userState = {
      remainingReadings: 1,
      isSubscribed: false,
      subscriptionExpiry: null,
      totalReadings: 0,
      purchaseHistory: []
    };
    this.saveUserState();
    console.log('🔄 Payment state reset');
  },

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  // Obtener resumen de cuenta
  getAccountSummary() {
    return {
      remainingReadings: this.getRemainingReadings(),
      isSubscribed: this.userState.isSubscribed,
      subscriptionExpiry: this.userState.subscriptionExpiry,
      totalReadings: this.userState.totalReadings,
      purchases: this.userState.purchaseHistory.length
    };
  },

  // Mostrar resumen en consola
  showAccountSummary() {
    const summary = this.getAccountSummary();
    console.log('%c💳 Resumen de Cuenta', 'color: #667eea; font-size: 16px; font-weight: bold;');
    console.table(summary);
  }
};

// Auto-inicialización cuando el DOM esté listo
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => PaymentSystem.init());
} else {
  PaymentSystem.init();
}

// Exponer globalmente
window.PaymentSystem = PaymentSystem;

console.log('💳 Módulo de Sistema de Pagos cargado');
