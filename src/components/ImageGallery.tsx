import React, { useState } from 'react'

interface ImageGalleryProps {
  images: string[]
  productName: string
}

export default function ImageGallery({ images, productName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  if (!images.length) {
    return (
      <div className="gallery-main">
        <img src="/placeholder.svg" alt={productName} className="gallery-img" />
      </div>
    )
  }

  return (
    <div className="gallery">
      <div className="gallery-main">
        <img
          src={images[selectedIndex]}
          alt={`${productName} - ${selectedIndex + 1}`}
          className="gallery-img"
        />
      </div>
      {images.length > 1 && (
        <div className="gallery-thumbs">
          {images.map((url, i) => (
            <button
              key={i}
              className={`gallery-thumb ${i === selectedIndex ? 'active' : ''}`}
              onClick={() => setSelectedIndex(i)}
            >
              <img src={url} alt={`${productName} thumbnail ${i + 1}`} />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
