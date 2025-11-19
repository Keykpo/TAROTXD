#!/bin/bash

# Script para crear Plan de Suscripción en PayPal
# TAROTXD - Plan Mensual $5.00 USD

echo "🚀 Creando Plan de Suscripción en PayPal..."
echo ""

# Credenciales
CLIENT_ID="ATYgo5oZHtYp6IZRno5MNDmOzjlPxeQw3Xu5XNpyAbYLZEL0mBStXxKJPl03oViiBRouuDmIkVs7XAQO"
SECRET="EHRqzsl-091sy9-2M4HgXFhAsexW4RJI-sWc3EZ1eyFe2TLwLqnQIj_He2mbKrl6QsciHAschu1altw9"
PRODUCT_ID="PROD-283525856L9710939"

# Paso 1: Obtener Access Token
echo "📝 Paso 1: Obteniendo Access Token..."
ACCESS_TOKEN=$(curl -s -X POST https://api-m.sandbox.paypal.com/v1/oauth2/token \
  -H "Accept: application/json" \
  -H "Accept-Language: en_US" \
  -u "$CLIENT_ID:$SECRET" \
  -d "grant_type=client_credentials" | grep -o '"access_token":"[^"]*' | cut -d'"' -f4)

if [ -z "$ACCESS_TOKEN" ]; then
  echo "❌ Error: No se pudo obtener el Access Token"
  echo "Verifica tus credenciales"
  exit 1
fi

echo "✅ Access Token obtenido"
echo ""

# Paso 2: Crear Plan de Suscripción
echo "📝 Paso 2: Creando Plan de Suscripción..."

RESPONSE=$(curl -s -X POST https://api-m.sandbox.paypal.com/v1/billing/plans \
  -H "Accept: application/json" \
  -H "Authorization: Bearer $ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -H "PayPal-Request-Id: TAROTXD-PLAN-$(date +%s)" \
  -d '{
    "product_id": "'"$PRODUCT_ID"'",
    "name": "TAROTXD Plan Mensual Ilimitado",
    "description": "Lecturas de tarot ilimitadas por mes",
    "billing_cycles": [
      {
        "frequency": {
          "interval_unit": "MONTH",
          "interval_count": 1
        },
        "tenure_type": "REGULAR",
        "sequence": 1,
        "total_cycles": 0,
        "pricing_scheme": {
          "fixed_price": {
            "value": "5.00",
            "currency_code": "USD"
          }
        }
      }
    ],
    "payment_preferences": {
      "auto_bill_outstanding": true,
      "setup_fee_failure_action": "CONTINUE",
      "payment_failure_threshold": 3
    }
  }')

# Extraer Plan ID
PLAN_ID=$(echo $RESPONSE | grep -o '"id":"P-[^"]*' | cut -d'"' -f4)

if [ -z "$PLAN_ID" ]; then
  echo "❌ Error: No se pudo crear el plan"
  echo "Respuesta de PayPal:"
  echo "$RESPONSE"
  exit 1
fi

echo "✅ Plan creado exitosamente"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 PLAN ID:"
echo ""
echo "   $PLAN_ID"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Detalles del Plan:"
echo "   • Nombre: TAROTXD Plan Mensual Ilimitado"
echo "   • Precio: \$5.00 USD/mes"
echo "   • Frecuencia: Mensual"
echo "   • Status: ACTIVE"
echo ""
echo "✅ Siguiente paso:"
echo "   Copia el PLAN ID de arriba y configúralo en payment-system.js"
echo ""

# Guardar en archivo
echo "$PLAN_ID" > .paypal-plan-id
echo "💾 Plan ID guardado en .paypal-plan-id"
