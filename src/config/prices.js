// Merkezi fiyat yapılandırması
// Bu dosya tüm fiyatların tek kaynağıdır

export const PACKAGE_PRICES = {
  economic: {
    value: 299,
    formatted: '₺299,00',
    currency: 'TRY',
    display: '₺299'
  },
  comfort: {
    value: 599,
    formatted: '₺599,00',
    currency: 'TRY',
    display: '₺599'
  },
  luxury: {
    value: 999,
    formatted: '₺999,00',
    currency: 'TRY',
    display: '₺999'
  }
}

// Fiyat formatlama fonksiyonu
export const formatPrice = (value, options = {}) => {
  const {
    showCurrency = true,
    showDecimals = false,
    currency = 'TRY',
    locale = 'tr-TR'
  } = options

  if (typeof value === 'string') {
    // String'den sayıya çevir (₺299 -> 299)
    value = parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.'))
  }

  if (isNaN(value)) {
    console.error('Geçersiz fiyat değeri:', value)
    return showCurrency ? '₺0,00' : '0,00'
  }

  const formatter = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0
  })

  return formatter.format(value)
}

// Paket fiyatını al
export const getPackagePrice = (packageType, options = {}) => {
  const packagePrice = PACKAGE_PRICES[packageType]
  
  if (!packagePrice) {
    console.error('Bilinmeyen paket tipi:', packageType)
    return formatPrice(0, options)
  }

  return formatPrice(packagePrice.value, options)
}

// Tüm paket fiyatlarını al
export const getAllPackagePrices = () => {
  return Object.keys(PACKAGE_PRICES).reduce((acc, key) => {
    acc[key] = {
      ...PACKAGE_PRICES[key],
      formatted: formatPrice(PACKAGE_PRICES[key].value, { showDecimals: true })
    }
    return acc
  }, {})
}

// Development ortamında fiyat değişikliklerini logla
export const logPriceChange = (packageType, oldPrice, newPrice) => {
  if (import.meta.env.DEV) {
    console.log(`💰 Fiyat değişikliği - ${packageType}:`, {
      eski: oldPrice,
      yeni: newPrice,
      zaman: new Date().toLocaleString('tr-TR')
    })
  }
}

// Cache busting için version
export const PRICE_CONFIG_VERSION = '1.0.0'
