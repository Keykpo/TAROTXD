# 🔍 Cómo Encontrar o Crear tu Plan ID de PayPal

## ❓ ¿Qué es el Plan ID?

El **Plan ID** es el identificador de tu plan de suscripción mensual. Se ve así:
```
P-1AB2CD3EF4GH5IJ6K7LM8NO9
```
- ✅ Siempre empieza con **"P-"**
- ✅ Tiene letras y números después del guión

## ❌ Lo que NO es el Plan ID

- `FVGHY9MV7N8MC` ← Esto es tu Merchant ID
- `7DC96732KA7763723UOPKETA` ← Esto es un Transaction/Order ID
- `ATYgo5oZHtYp6IZRno...` ← Esto es tu Client ID

---

## 🔍 Opción 1: Buscar si Ya Tienes un Plan

### Paso 1: Ir a PayPal
Abre: https://www.paypal.com/businessprofile/mytools/manage-subscriptions

### Paso 2: Buscar Planes
¿Ves algo como esto?

```
┌─────────────────────────────────────┐
│ Productos y Planes de Suscripción   │
├─────────────────────────────────────┤
│ TAROTXD Premium                     │
│ Plan Mensual: $5.00 USD             │
│ Plan ID: P-12ABC...                 │ ← ESTE ES EL QUE NECESITAS
└─────────────────────────────────────┘
```

**Si lo ves:**
1. ✅ Copia el Plan ID (empieza con P-)
2. ✅ Pégalo aquí y lo configuro

**Si NO lo ves:**
- Ve a la Opción 2 para crear uno

---

## ➕ Opción 2: Crear un Plan Nuevo (Más Fácil)

### Link Directo:
👉 https://www.paypal.com/businessprofile/mytools/manage-subscriptions

### Pasos Simples:

1. **Click en "Crear producto"**

2. **Llenar formulario:**
   ```
   Nombre del producto: TAROTXD Premium
   Tipo: Servicio digital
   Categoría: Entretenimiento
   ```
   Click **"Crear producto"**

3. **Agregar Plan de Precios:**
   - Dentro del producto que creaste
   - Click **"Agregar plan de precios"**

   ```
   Nombre del plan: Plan Mensual Ilimitado
   Precio: $5.00 USD
   Frecuencia de facturación: Mensual
   ```

   Click **"Crear plan"**

4. **Activar el Plan:**
   - El plan se crea como "Borrador"
   - Click en el botón **"Activar"**

5. **Copiar el Plan ID:**
   - Una vez activado, verás:
   ```
   Plan ID: P-1AB2CD3EF4GH5IJ6K7LM8NO9
   ```
   - ✅ COPIA ESTE ID

---

## 📱 Si Estás en Móvil

Es más fácil hacer esto desde computadora. Si estás en móvil:
1. Abre PayPal en el navegador (no la app)
2. Activa "Modo escritorio" en el navegador
3. Sigue los pasos de arriba

---

## 🆘 Alternativa: Sin Suscripciones por Ahora

Si no quieres lidiar con esto ahora, puedo:

**Deshabilitar las suscripciones temporalmente**
- Solo ofrecer el Pack de 5 lecturas por $1.49
- El pack ya funciona 100%
- Agregar suscripciones después cuando quieras

¿Quieres que haga eso?

---

## ✅ Una Vez que Tengas el Plan ID

Cuando lo encuentres o crees, dímelo y hago esto:

```javascript
// En payment-system.js
subscriptionId: 'P-TU_PLAN_ID_AQUI'  // ← Lo configuro en 5 segundos
```

Y listo! Todo funciona.

---

## 💡 Consejo

Si esta es la primera vez que usas suscripciones de PayPal:
- Toma 5-10 minutos crear el plan
- Es un proceso de una sola vez
- Después todo es automático

**¿Necesitas que te guíe paso a paso mientras lo haces?**
