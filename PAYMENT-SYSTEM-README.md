# 💳 Sistema de Pagos TAROTXD - Guía Rápida

## 🎯 Resumen

El sistema de pagos permite monetizar las lecturas de tarot con PayPal:

- ✅ **Primera lectura**: GRATIS
- 💵 **Pack de 5 lecturas**: $1.49 USD
- 🔄 **Suscripción mensual**: $5.00 USD (lecturas ilimitadas)

---

## 📦 Archivos Nuevos

### 1. `payment-system.js` (~12 KB)
Sistema completo de pagos y créditos.

**Funcionalidades:**
- ✅ Gestión de créditos (1 gratis, luego pago)
- ✅ Integración con PayPal SDK
- ✅ Compra de packs (5 lecturas)
- ✅ Suscripciones mensuales
- ✅ Modal de pricing
- ✅ Almacenamiento en localStorage
- ✅ Historial de compras

### 2. `payment-styles.css` (~6 KB)
Estilos para el sistema de pagos.

**Incluye:**
- 🎨 Modal de pricing responsive
- 💳 Tarjetas de planes
- 🔔 Display de créditos
- ⚡ Animaciones
- 🌙 Dark mode support

### 3. `PAYPAL-SETUP.md`
Guía completa de configuración de PayPal (ver archivo para detalles).

---

## 🚀 Inicio Rápido

### Paso 1: Configurar PayPal Client ID

1. Ve a [PayPal Developer](https://developer.paypal.com/)
2. Crea una app
3. Copia tu **Client ID**

4. Abre `payment-system.js` y actualiza:

```javascript
const PaymentSystem = {
  // Reemplaza con tu Client ID
  paypalClientId: 'TU_PAYPAL_CLIENT_ID_AQUI',
  // ...
}
```

### Paso 2: Crear Plan de Suscripción

1. En PayPal Dashboard, ve a "Plans"
2. Crea un plan:
   - **Precio**: $5.00 USD
   - **Frecuencia**: Mensual
3. Copia el **Plan ID**

4. Actualiza en `payment-system.js`:

```javascript
pricing: {
  // ...
  subscriptionId: 'P-TU_PLAN_ID_AQUI'
}
```

### Paso 3: Probar

```bash
# Iniciar servidor
python -m http.server 3000

# O con Node.js
npx http-server -p 3000
```

Abre: `http://localhost:3000/tarot-reading.html`

1. Haz tu primera lectura (gratis)
2. Intenta hacer una segunda lectura
3. Se mostrará el modal de pricing con botones de PayPal

---

## 🎮 Cómo Funciona

### Flujo de Usuario

```
Usuario entra al sitio
      ↓
Primera lectura GRATIS
      ↓
Intenta segunda lectura
      ↓
Modal de Pricing aparece
      ↓
Elige un plan:
  → Pack de 5 lecturas ($1.49)
  → Suscripción mensual ($5.00)
      ↓
Paga con PayPal
      ↓
Créditos agregados automáticamente
      ↓
Puede hacer más lecturas
```

### Verificación de Créditos

Antes de cada lectura, el sistema verifica:

```javascript
// En tarot-functionality.js
performTarotReading(question = '') {
  // Verifica créditos primero
  if (!this.checkCreditsBeforeReading()) {
    console.log('⛔ Sin créditos');
    return null; // Muestra modal de pricing
  }

  // Continúa con la lectura...
}
```

### Almacenamiento

Todo se guarda en `localStorage`:

```javascript
// Estado del usuario
{
  remainingReadings: 5,        // Lecturas restantes
  isSubscribed: false,         // ¿Tiene suscripción?
  subscriptionExpiry: null,    // Fecha de expiración
  totalReadings: 10,           // Total de lecturas hechas
  purchaseHistory: [           // Historial de compras
    {
      type: 'pack',
      amount: 1.49,
      readings: 5,
      date: '2024-11-18T...',
      orderId: 'PAYPAL123'
    }
  ]
}
```

---

## 🎨 UI Implementada

### 1. Display de Créditos (Esquina Superior Derecha)

```
┌─────────────────────┐
│ 🎴 Lecturas: 5     │  ← Click para ver planes
└─────────────────────┘
```

**Estados:**
- **Normal**: Fondo morado, muestra número
- **Ilimitadas**: Fondo rosa, muestra ∞
- **Sin créditos**: Fondo rojo, pulsa

### 2. Modal de Pricing

Aparece automáticamente cuando:
- Usuario se queda sin créditos
- Usuario hace click en el display de créditos

**Incluye:**
- 2 tarjetas de planes
- Botones de PayPal integrados
- Información de seguridad
- Responsive design

### 3. Notificaciones

Mensajes que aparecen después de:
- ✅ Compra exitosa
- ❌ Error en pago
- ℹ️ Pago cancelado

---

## 💻 API de Consola

Puedes probar el sistema desde la consola del navegador:

```javascript
// Ver estado del sistema
PaymentSystem.getAccountSummary()

// Ver créditos restantes
PaymentSystem.getRemainingReadings()

// Agregar créditos manualmente (para pruebas)
PaymentSystem.addReadings(5)

// Activar suscripción manualmente (para pruebas)
PaymentSystem.userState.isSubscribed = true
PaymentSystem.userState.subscriptionExpiry = new Date(Date.now() + 30*24*60*60*1000).toISOString()
PaymentSystem.saveUserState()

// Resetear todo
PaymentSystem.resetUserState()

// Mostrar modal de pricing
PaymentSystem.showPricingModal()

// Ver historial de compras
PaymentSystem.userState.purchaseHistory
```

---

## 🧪 Modo de Prueba (Sandbox)

### Configuración para Desarrollo

```javascript
// En payment-system.js
paypalClientId: 'SANDBOX_CLIENT_ID', // Usa Sandbox para pruebas
```

### Cuentas de Prueba

PayPal te proporciona cuentas de prueba:

```
Comprador (Personal):
Email: sb-buyer123@personal.example.com
Pass: 12345678

Vendedor (Business):
Email: sb-business456@business.example.com
Pass: 87654321
```

### Realizar Compra de Prueba

1. Haz click en botón de PayPal
2. Usa credenciales de cuenta de **comprador**
3. Completa el pago
4. Verás los créditos agregados

### Verificar Transacción

1. Ve a [Sandbox PayPal](https://www.sandbox.paypal.com/)
2. Inicia sesión con cuenta de **vendedor**
3. Revisa transacciones en "Activity"

---

## 🔧 Personalización

### Cambiar Precios

```javascript
// En payment-system.js
pricing: {
  freeReadings: 1,          // Lecturas gratis
  packPrice: 1.49,          // Precio del pack
  packReadings: 5,          // Cantidad en el pack
  subscriptionPrice: 5.00,  // Precio mensual
  // ...
}
```

### Cambiar Diseño de Botones

```javascript
// En initPackPurchase() y initSubscription()
window.paypal.Buttons({
  style: {
    shape: 'rect',      // 'pill' o 'rect'
    color: 'blue',      // 'gold', 'blue', 'silver', etc.
    layout: 'horizontal',
    label: 'pay'        // 'paypal', 'checkout', 'buynow', 'pay'
  },
  // ...
})
```

### Personalizar Modal

Edita `payment-styles.css`:

```css
.pricing-card {
  /* Cambia colores, tamaños, etc. */
  background: linear-gradient(135deg, #tu-color1, #tu-color2);
}
```

---

## 🛡️ Seguridad

### ⚠️ IMPORTANTE

**Limitación Actual:**
- El sistema usa `localStorage` para guardar créditos
- Los usuarios técnicos pueden manipular `localStorage`
- **NO recomendado para producción sin backend**

### Recomendaciones para Producción

1. **Implementar Backend**
   ```
   Usuario → Frontend → Backend → PayPal
                ↓           ↓
           localStorage  Base de Datos
   ```

2. **Usar Webhooks**
   - PayPal envía confirmación a tu servidor
   - Tu servidor valida el pago
   - Agrega créditos en base de datos
   - Frontend consulta backend para verificar

3. **Validación del Servidor**
   ```javascript
   // Antes de cada lectura
   const hasCredits = await fetch('/api/check-credits')
   if (!hasCredits) {
     // Mostrar paywall
   }
   ```

### Para Uso Personal/Demo

Si es solo para ti o para demos:
- ✅ El sistema actual funciona perfectamente
- ✅ localStorage es suficiente
- ✅ No hay riesgo de fraude

---

## 📊 Monitoreo

### Ver Estadísticas

```javascript
// En consola del navegador
const stats = {
  totalUsers: Object.keys(localStorage).filter(k => k.includes('tarot')).length,
  totalReadings: PaymentSystem.userState.totalReadings,
  purchases: PaymentSystem.userState.purchaseHistory.length,
  revenue: PaymentSystem.userState.purchaseHistory.reduce((sum, p) => sum + p.amount, 0)
}
console.table(stats)
```

### Dashboard de PayPal

Para ver transacciones reales:
- **Sandbox**: https://www.sandbox.paypal.com/
- **Live**: https://www.paypal.com/

Menú → Activity → All Transactions

---

## 🐛 Solución de Problemas

### Los botones de PayPal no aparecen

**Causa**: PayPal SDK no se cargó

**Solución**:
```javascript
// Verifica en consola
console.log(window.paypal) // Debe mostrar objeto

// Si es undefined, revisa el Client ID
console.log(PaymentSystem.paypalClientId)
```

### Error: "Client ID not configured"

**Solución**: Actualiza el Client ID en `payment-system.js`

### Los créditos no se guardan

**Solución**:
```javascript
// Verifica localStorage
console.log(localStorage.getItem('tarotPaymentState'))

// Si es null, el navegador bloqueó localStorage
// Revisa configuración de privacidad/cookies
```

### Pago completado pero no se agregan créditos

**Solución**:
```javascript
// Abre consola durante el pago
// Busca el log: "✅ Pago aprobado"

// Si no aparece, verifica el callback onApprove
// Puede haber un error de JavaScript
```

### Modal no se cierra después del pago

**Solución**:
```javascript
// Cerrar manualmente
PaymentSystem.closeAllModals()

// O recargar página
location.reload()
```

---

## 📝 Checklist de Implementación

- [x] `payment-system.js` creado
- [x] `payment-styles.css` creado
- [x] `tarot-functionality.js` actualizado con verificación
- [x] Integrado en 11 páginas HTML
- [ ] Client ID de PayPal configurado
- [ ] Plan de suscripción creado en PayPal
- [ ] Plan ID configurado
- [ ] Probado en modo Sandbox
- [ ] Términos de servicio actualizados
- [ ] Política de reembolsos definida
- [ ] Listo para producción

---

## 🎓 Tutorial Paso a Paso

### Para el Usuario Final

1. **Primera visita**
   - Entra al sitio
   - Hace 1 lectura GRATIS

2. **Segunda lectura**
   - Intenta hacer otra lectura
   - Ve modal de pricing
   - Elige un plan

3. **Comprar Pack**
   - Click en "Pack de 5 Lecturas"
   - Click en botón PayPal
   - Inicia sesión en PayPal
   - Confirma pago de $1.49
   - Recibe 5 créditos

4. **Usar Créditos**
   - Hace hasta 5 lecturas más
   - Ve contador en esquina superior

5. **Suscripción Alternativa**
   - Si hace muchas lecturas
   - Puede suscribirse por $5/mes
   - Lecturas ilimitadas

---

## 🚀 Próximos Pasos Sugeridos

### Fase 1: Testing (Ahora)
- [ ] Configurar Sandbox
- [ ] Hacer compras de prueba
- [ ] Probar en diferentes navegadores
- [ ] Probar en móvil

### Fase 2: Backend (Opcional)
- [ ] Crear API en Node.js/Python/PHP
- [ ] Implementar base de datos
- [ ] Configurar webhooks de PayPal
- [ ] Validar pagos del lado del servidor

### Fase 3: Mejoras
- [ ] Sistema de usuarios (registro/login)
- [ ] Email de confirmación
- [ ] Cupones de descuento
- [ ] Programa de referidos
- [ ] Analytics y tracking

---

## 📞 Soporte

### Recursos

- 📖 [Documentación completa de configuración](PAYPAL-SETUP.md)
- 💻 [PayPal Developer Docs](https://developer.paypal.com/docs/)
- 🎯 [Tutorial de PayPal SDK](https://developer.paypal.com/sdk/js/)

### Comandos Útiles

```javascript
// Consola de debug
PaymentSystem.showAccountSummary()

// Resetear para volver a probar
PaymentSystem.resetUserState()
TarotSystem.clearHistory()

// Simular suscripción
PaymentSystem.userState.isSubscribed = true
PaymentSystem.saveUserState()
```

---

**¡Sistema de pagos listo! Ahora puedes monetizar tu sitio de tarot.** 💳✨

Para configurar PayPal, consulta: **[PAYPAL-SETUP.md](PAYPAL-SETUP.md)**
