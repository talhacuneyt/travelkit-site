import React from 'react'
import { getPackagePrice, formatPrice } from '../../config/prices'
import '../../styles/price.css'

const Price = ({ 
  value, 
  packageType, 
  size = 'medium', 
  showCurrency = true, 
  showDecimals = false,
  className = '',
  ...props 
}) => {
  // Fiyat değerini belirle
  let priceValue = value
  
  if (packageType && !value) {
    priceValue = getPackagePrice(packageType, { showDecimals })
  } else if (value) {
    priceValue = formatPrice(value, { showCurrency, showDecimals })
  }

  if (!priceValue) {
    console.error('Price component: Geçersiz fiyat değeri', { value, packageType })
    return <span className={`price price--${size} ${className}`} {...props}>₺0,00</span>
  }

  // Development ortamında fiyat değişikliklerini logla
  if (import.meta.env.DEV && packageType) {
    console.log(`💰 Price component - ${packageType}:`, priceValue)
  }

  return (
    <span 
      className={`price price--${size} price-container ${className}`} 
      {...props}
    >
      {priceValue}
    </span>
  )
}

export default Price
