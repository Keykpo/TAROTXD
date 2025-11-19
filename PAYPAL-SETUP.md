# 💳 Configuración de PayPal para TAROTXD

## 📋 Resumen

Esta guía te ayudará a configurar PayPal para aceptar pagos en tu sitio de tarot.

### Planes de Precio:
- ✅ **Primera lectura**: GRATIS
- 💵 **Pack de 5 lecturas**: $1.49 USD
- 🔄 **Suscripción mensual**: $5.00 USD (lecturas ilimitadas)

---

## 🚀 Paso 1: Crear Cuenta de PayPal Business

### 1.1 Registro

1. Ve a [PayPal Developer](https://developer.paypal.com/)
2. Inicia sesión o crea una cuenta
3. Ve a "Dashboard" → "Apps & Credentials"

### 1.2 Crear App

1. Haz clic en "Create App"
2. Nombre de la app: "TAROTXD Payments"
3. Selecciona "Merchant" como tipo de cuenta
4. Haz clic en "Create App"

### 1.3 Obtener Credenciales

Después de crear la app, verás:

**Sandbox** (para pruebas):
```
Client ID: AabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345
Secret: EFG...
```

**Live** (producción):
```
Client ID: (se genera cuando tu app es aprobada)
Secret: (mantén esto en secreto)
```

---

## 🔧 Paso 2: Configurar el Código

### 2.1 Actualizar Client ID

Abre el archivo `payment-system.js` y actualiza:

```javascript
const PaymentSystem = {
  // ANTES:
  paypalClientId: 'YOUR_PAYPAL_CLIENT_ID',

  // DESPUÉS (Sandbox):
  paypalClientId: 'AabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345',

  // DESPUÉS (Producción):
  paypalClientId: 'TU_CLIENT_ID_REAL',

  // ...
}
```

**⚠️ IMPORTANTE**:
- Para pruebas, usa el **Sandbox Client ID**
- Para producción, usa el **Live Client ID**

---

## 📦 Paso 3: Crear Plan de Suscripción

### 3.1 Acceder a Suscripciones

1. Ve a [PayPal Developer Dashboard](https://developer.paypal.com/dashboard/)
2. En Sandbox, ve a "Plans"
3. Haz clic en "Create Plan"

### 3.2 Configurar el Plan

**Información básica:**
- **Product name**: Suscripción TAROTXD Premium
- **Product type**: Digital goods
- **Product category**: Digital content

**Pricing:**
- **Plan name**: Plan Mensual Ilimitado
- **Plan description**: Lecturas de tarot ilimitadas por un mes
- **Billing cycle**: Monthly
- **Price**: $5.00 USD
- **Setup fee**: $0.00 USD

**Payment preferences:**
- **Auto-renewal**: Yes
- **Trial period**: No (opcional: 7 days free)

### 3.3 Obtener el Plan ID

Después de crear el plan, copia el **Plan ID**:

```
Plan ID: P-1AB2CD3EF4GH5IJ6K7LM8NO9
```

### 3.4 Actualizar en el Código

```javascript
pricing: {
  // ...
  subscriptionId: 'P-1AB2CD3EF4GH5IJ6K7LM8NO9' // ← Tu Plan ID aquí
}
```

---

## 🧪 Paso 4: Probar en Sandbox

### 4.1 Crear Cuentas de Prueba

1. Ve a [Sandbox Accounts](https://developer.paypal.com/dashboard/accounts)
2. Crea dos cuentas:
   - **Personal Account** (comprador)
   - **Business Account** (vendedor - ya creada)

### 4.2 Obtener Credenciales de Prueba

Para cada cuenta sandbox, verás:
```
Email: sb-buyer12345@personal.example.com
Password: 12345678
```

### 4.3 Realizar Prueba de Compra

1. Abre tu sitio: `http://localhost:3000`
2. Intenta hacer una segunda lectura de tarot
3. Se mostrará el modal de pricing
4. Haz clic en el botón de PayPal
5. Usa las credenciales de **Personal Account** del sandbox
6. Completa el pago

### 4.4 Verificar Pago

1. Ve a tu [Sandbox Dashboard](https://www.sandbox.paypal.com/)
2. Inicia sesión con tu **Business Account**
3. Verifica que el pago aparezca en "Activity"

---

## 🌐 Paso 5: Pasar a Producción

### 5.1 Verificar Cuenta Business

1. Ve a [PayPal Business](https://www.paypal.com/businessmanage/account/aboutBusiness)
2. Completa la verificación de negocio
3. Agrega información bancaria

### 5.2 Activar App en Live

1. Ve a tu app en [PayPal Developer](https://developer.paypal.com/dashboard/applications/live)
2. Solicita "Go Live"
3. Completa el proceso de revisión
4. Obtén tu **Live Client ID**

### 5.3 Crear Plan de Suscripción Live

Repite el **Paso 3** pero en modo **Live** (no Sandbox)

### 5.4 Actualizar Código para Producción

```javascript
// En payment-system.js

const PaymentSystem = {
  // Cambiar a Live Client ID
  paypalClientId: 'TU_LIVE_CLIENT_ID',

  pricing: {
    // ...
    // Cambiar a Live Plan ID
    subscriptionId: 'P-LIVE_PLAN_ID'
  },

  // ...
}
```

---

## 🔐 Paso 6: Configurar Webhooks (Opcional pero Recomendado)

### ⚠️ IMPORTANTE

Actualmente, el sistema funciona 100% del lado del cliente usando `localStorage`. Esto significa:

- ✅ **Ventaja**: No necesitas servidor
- ❌ **Desventaja**: Los usuarios pueden manipular `localStorage`

Para mayor seguridad, **se recomienda** implementar un backend simple que:

1. Verifique pagos mediante webhooks de PayPal
2. Almacene créditos en una base de datos
3. Valide lecturas antes de ejecutarlas

### 6.1 Configurar Webhook

Si decides implementar backend:

1. Ve a [PayPal Webhooks](https://developer.paypal.com/dashboard/webhooks)
2. Haz clic en "Add Webhook"
3. URL: `https://tudominio.com/api/paypal-webhook`
4. Selecciona eventos:
   - `PAYMENT.SALE.COMPLETED`
   - `BILLING.SUBSCRIPTION.CREATED`
   - `BILLING.SUBSCRIPTION.ACTIVATED`
   - `BILLING.SUBSCRIPTION.CANCELLED`

### 6.2 Implementar Endpoint (Ejemplo Node.js)

```javascript
// api/paypal-webhook.js
const express = require('express');
const app = express();

app.post('/api/paypal-webhook', express.json(), async (req, res) => {
  const event = req.body;

  // Verificar firma de PayPal
  // const isValid = verifyPayPalSignature(req);
  // if (!isValid) return res.status(400).send('Invalid signature');

  switch (event.event_type) {
    case 'PAYMENT.SALE.COMPLETED':
      // Agregar 5 lecturas al usuario
      await addReadingsToUser(event.resource.custom_id, 5);
      break;

    case 'BILLING.SUBSCRIPTION.ACTIVATED':
      // Activar suscripción del usuario
      await activateSubscription(event.resource.subscriber.email);
      break;

    case 'BILLING.SUBSCRIPTION.CANCELLED':
      // Desactivar suscripción
      await deactivateSubscription(event.resource.subscriber.email);
      break;
  }

  res.status(200).send('OK');
});

app.listen(3000);
```

---

## 📊 Paso 7: Monitorear Transacciones

### 7.1 Dashboard de PayPal

- **Sandbox**: https://www.sandbox.paypal.com/
- **Live**: https://www.paypal.com/

### 7.2 Reportes

1. Ve a "Activity" para ver transacciones
2. Ve a "Reports" para descargar reportes mensuales
3. Ve a "Subscriptions" para gestionar suscripciones activas

### 7.3 Cancelar Suscripción

Los usuarios pueden cancelar desde:
- Su cuenta de PayPal → Configuración → Pagos → Gestionar pagos automáticos
- Tu sitio (si implementas la funcionalidad)

---

## 🛠️ Configuración Avanzada

### Personalizar Botones de PayPal

En `payment-system.js`:

```javascript
window.paypal.Buttons({
  style: {
    shape: 'pill',      // 'pill' o 'rect'
    color: 'gold',      // 'gold', 'blue', 'silver', 'white', 'black'
    layout: 'vertical', // 'vertical' o 'horizontal'
    label: 'paypal',    // 'paypal', 'checkout', 'buynow', 'pay'
    tagline: false      // Mostrar/ocultar tagline
  },
  // ...
})
```

### Agregar Descuentos

```javascript
// En payment-system.js, modifica createOrder:

createOrder: (data, actions) => {
  return actions.order.create({
    purchase_units: [{
      description: 'Pack de 5 Lecturas de Tarot',
      amount: {
        currency_code: 'USD',
        value: '1.49',
        breakdown: {
          item_total: { value: '1.99', currency_code: 'USD' },
          discount: { value: '0.50', currency_code: 'USD' }
        }
      }
    }]
  });
}
```

### Agregar Impuestos

```javascript
amount: {
  currency_code: 'USD',
  value: '1.64', // Total con impuestos
  breakdown: {
    item_total: { value: '1.49', currency_code: 'USD' },
    tax_total: { value: '0.15', currency_code: 'USD' }
  }
}
```

---

## 🐛 Solución de Problemas

### Error: "Client ID not found"

**Solución**: Verifica que el Client ID esté correctamente copiado en `payment-system.js`

### Error: "Plan ID not found"

**Solución**:
1. Verifica que el Plan ID sea correcto
2. Asegúrate de estar usando Sandbox Plan ID para pruebas y Live Plan ID para producción

### Error: "Script load failed"

**Solución**: Verifica que `payment-system.js` se cargue antes que `tarot-functionality.js`

```html
<!-- Orden correcto -->
<script src="/payment-system.js"></script>
<script src="/tarot-functionality.js"></script>
```

### Los botones de PayPal no aparecen

**Solución**:
1. Abre la consola del navegador (F12)
2. Verifica errores de JavaScript
3. Asegúrate de que los contenedores existan: `#paypal-pack-button` y `#paypal-subscription-button`
4. Verifica que el PayPal SDK se haya cargado correctamente

### El pago se completa pero no se agregan créditos

**Solución**:
1. Abre la consola del navegador
2. Verifica que el callback `onApprove` se ejecute
3. Revisa `localStorage` para ver el estado: `localStorage.getItem('tarotPaymentState')`
4. Si usas backend, verifica que los webhooks funcionen

---

## 📝 Checklist Pre-Lanzamiento

Antes de lanzar en producción:

- [ ] Cuenta de PayPal Business verificada
- [ ] Live Client ID obtenido y configurado
- [ ] Plan de suscripción creado en modo Live
- [ ] Live Plan ID configurado en el código
- [ ] Pruebas realizadas en Sandbox
- [ ] Términos de servicio y política de privacidad actualizados
- [ ] Política de reembolsos definida
- [ ] Información bancaria agregada a PayPal
- [ ] Webhooks configurados (si usas backend)
- [ ] SSL/HTTPS habilitado en tu sitio
- [ ] Cumplimiento con GDPR/leyes locales

---

## 💡 Consejos y Mejores Prácticas

### Seguridad

1. **Nunca** expongas tu Secret Key en el código del cliente
2. Usa HTTPS en producción
3. Implementa rate limiting para prevenir abuso
4. Valida pagos en el backend cuando sea posible

### UX

1. Muestra claramente qué incluye cada plan
2. Permite a los usuarios ver su historial de compras
3. Facilita la cancelación de suscripciones
4. Envía confirmaciones por email (requiere backend)

### Legal

1. Ten términos de servicio claros
2. Define una política de reembolsos
3. Cumple con leyes de protección al consumidor
4. Informa sobre renovaciones automáticas

### Testing

1. Prueba todos los flujos de pago en Sandbox
2. Prueba cancelaciones de suscripción
3. Verifica que los créditos se agreguen correctamente
4. Prueba con diferentes navegadores

---

## 📞 Soporte

### Documentación de PayPal

- [Getting Started](https://developer.paypal.com/docs/checkout/)
- [Subscriptions](https://developer.paypal.com/docs/subscriptions/)
- [Webhooks](https://developer.paypal.com/docs/api-basics/notifications/webhooks/)

### Comunidad

- [Stack Overflow - PayPal Tag](https://stackoverflow.com/questions/tagged/paypal)
- [PayPal Community](https://www.paypal-community.com/)

### Contacto PayPal

- **Sandbox Issues**: developer-support@paypal.com
- **Live Account**: Desde tu dashboard de PayPal

---

## 🎯 Próximos Pasos Recomendados

1. **Implementar Backend** (Node.js, Python, PHP)
   - Verificación de pagos segura
   - Base de datos de usuarios
   - API para validar créditos

2. **Sistema de Usuarios**
   - Registro/Login
   - Perfil de usuario
   - Historial de lecturas

3. **Email Notifications**
   - Confirmación de compra
   - Recordatorio de renovación
   - Bienvenida a nuevos usuarios

4. **Analytics**
   - Seguimiento de conversiones
   - Análisis de retención
   - A/B testing de precios

---

## 📄 Código Completo de Ejemplo

### Archivo: payment-config-example.js

```javascript
// CONFIGURACIÓN PARA DESARROLLO (SANDBOX)
const DEVELOPMENT_CONFIG = {
  paypalClientId: 'AabcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ012345',
  subscriptionId: 'P-1AB2CD3EF4GH5IJ6K7LM8NO9',
  environment: 'sandbox'
};

// CONFIGURACIÓN PARA PRODUCCIÓN (LIVE)
const PRODUCTION_CONFIG = {
  paypalClientId: 'TU_LIVE_CLIENT_ID_AQUI',
  subscriptionId: 'P-LIVE_PLAN_ID_AQUI',
  environment: 'live'
};

// Seleccionar configuración según ambiente
const CONFIG = window.location.hostname === 'localhost'
  ? DEVELOPMENT_CONFIG
  : PRODUCTION_CONFIG;

// Actualizar PaymentSystem con la configuración
PaymentSystem.paypalClientId = CONFIG.paypalClientId;
PaymentSystem.pricing.subscriptionId = CONFIG.subscriptionId;
```

---

**¡Todo listo! Tu sistema de pagos con PayPal está configurado.** 💳✨

Para más ayuda, consulta la [documentación oficial de PayPal](https://developer.paypal.com/).
