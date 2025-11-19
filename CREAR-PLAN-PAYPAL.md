# 🚀 Guía Rápida: Crear Plan de Suscripción en PayPal

## 📋 Paso a Paso

### 1. Acceder a PayPal Developer Dashboard

Abre tu navegador y ve a:
👉 **https://developer.paypal.com/dashboard/**

Inicia sesión con tu cuenta de PayPal.

---

### 2. Ir a la Sección de Productos

En el menú lateral izquierdo:
1. Haz clic en **"My Apps & Credentials"**
2. Verifica que tu app esté creada (si no, créala)
3. Luego ve a **"Products"** en el menú superior
4. Selecciona **"Subscriptions"**

**O directamente:**
👉 https://developer.paypal.com/dashboard/applications/sandbox

---

### 3. Crear un Producto

Primero necesitas un "Producto":

1. Click en **"Create Product"**
2. Completa:
   ```
   Product name: TAROTXD Premium
   Product type: Digital
   Category: Digital content
   ```
3. Click **"Save"**
4. Copia el **Product ID** que aparece (ejemplo: `PROD-12345`)

---

### 4. Crear el Plan de Suscripción

Dentro del producto que creaste:

1. Click en **"Add Pricing Plan"** o **"Create Plan"**

2. Completa los datos:

   **Plan Details:**
   ```
   Plan name: Plan Mensual Ilimitado
   Plan ID: (se genera automáticamente, déjalo así)
   ```

   **Billing Cycles:**
   ```
   Billing frequency: Monthly
   Tenure type: Regular
   Sequence: 1
   Total cycles: 0 (ilimitado, se renueva hasta que se cancele)
   ```

   **Pricing:**
   ```
   Price per billing cycle: $5.00 USD
   Setup fee: $0.00 USD
   ```

   **Payment Preferences:**
   ```
   ✅ Auto renewal (que se renueve automáticamente)
   ❌ Trial period (sin período de prueba, aunque puedes agregar 7 días gratis si quieres)
   ```

3. Click **"Save"** o **"Create"**

---

### 5. Activar el Plan

**IMPORTANTE:** El plan se crea en estado "Draft" (borrador)

1. Busca el botón **"Activate"** o **"Change Status"**
2. Cambia el status a **"Active"**

---

### 6. Copiar el Plan ID

Una vez activado:

1. Verás el **Plan ID** (ejemplo: `P-1AB2CD3EF4GH5IJ6K7LM8NO9`)
2. **CÓPIALO** - lo necesitarás en el siguiente paso

El Plan ID se ve así:
```
P-1AB2CD3EF4GH5IJ6K7LM8NO9
```

---

### 7. Configurar el Plan ID en tu Código

Abre el archivo `payment-system.js` y busca la línea ~20:

```javascript
pricing: {
  freeReadings: 1,
  packPrice: 1.49,
  packReadings: 5,
  subscriptionPrice: 5.00,
  subscriptionId: 'YOUR_PAYPAL_PLAN_ID' // ← REEMPLAZA ESTO
}
```

Reemplaza `'YOUR_PAYPAL_PLAN_ID'` con tu Plan ID real:

```javascript
subscriptionId: 'P-1AB2CD3EF4GH5IJ6K7LM8NO9'
```

---

## ✅ Verificación

Para verificar que todo está bien:

1. En PayPal Dashboard, ve a **"Subscriptions"** → **"Plans"**
2. Deberías ver tu plan con status **"ACTIVE"**
3. Precio: **$5.00 USD**
4. Frecuencia: **Monthly**

---

## 🧪 Modo Sandbox vs Live

### Si estás en Sandbox (Pruebas):
- ✅ Usa las credenciales que te di (ya configuradas)
- ✅ Crea el plan en modo **Sandbox**
- ✅ Usa cuentas de prueba para comprar

### Para pasar a Live (Producción):
1. Cambia el toggle de **Sandbox** → **Live**
2. Repite los pasos 3-6 para crear el plan en Live
3. Actualiza el Client ID y Plan ID en el código

---

## 🎯 Resumen

Al final deberías tener:

```javascript
// En payment-system.js

const PaymentSystem = {
  paypalClientId: 'ATYgo5oZHtYp6IZRno5MNDmOzjlPxeQw3Xu5XNpyAbYLZEL0mBStXxKJPl03oViiBRouuDmIkVs7XAQO', // ✅ Ya configurado

  pricing: {
    freeReadings: 1,
    packPrice: 1.49,
    packReadings: 5,
    subscriptionPrice: 5.00,
    subscriptionId: 'P-TU_PLAN_ID_AQUI' // ← Falta configurar esto
  }
}
```

---

## ❓ ¿Tienes Problemas?

### "No veo la opción de crear producto"
- Ve a: https://www.paypal.com/businessprofile/settings/
- Completa la verificación de tu cuenta Business

### "El plan no se activa"
- Verifica que el producto esté guardado primero
- Asegúrate de estar en modo Sandbox o Live (no mezclar)

### "No encuentro el Plan ID"
- Una vez creado el plan, haz click en él
- El Plan ID aparece arriba, empieza con `P-`

---

## 📞 Ayuda Adicional

Si necesitas ayuda:
1. Avísame cuando llegues al paso donde te trabas
2. Toma un screenshot si es posible
3. Te ayudo a resolver

---

**Cuando termines de crear el plan, dame el Plan ID y lo configuro en el código!** 🎯
