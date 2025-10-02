import { useEffect, useRef, useState } from 'react'

function LazyImg({
    src,
    alt = '',
    className = '',
    style,
    width,
    height,
    loading = 'lazy',
    fetchpriority, // backward compat from callers
    fetchPriority,
    sizes,
    srcSet
}) {
    const imgRef = useRef(null)
    const [isVisible, setIsVisible] = useState(loading !== 'lazy')
    const [isLoaded, setIsLoaded] = useState(false)
    const [currentSrc, setCurrentSrc] = useState(isVisible && src ? src : null)

    useEffect(() => {
        if (isVisible) return
        const el = imgRef.current
        if (!el) return
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        setIsVisible(true)
                        observer.disconnect()
                    }
                })
            },
            { rootMargin: '200px 0px' }
        )
        observer.observe(el)
        return () => observer.disconnect()
    }, [isVisible])

    useEffect(() => {
        if (!isVisible || !src) return
        // Delay setting src to next frame for smoother main thread
        const id = requestAnimationFrame(() => {
            setCurrentSrc(src)
        })
        return () => cancelAnimationFrame(id)
    }, [isVisible, src])

    useEffect(() => {
        const el = imgRef.current
        if (!el) return
        if (!currentSrc) return
        let cancelled = false
        const tryDecode = async () => {
            try {
                if ('decode' in el) {
                    await el.decode()
                }
            } catch (_) {
                // ignore decode errors (e.g., if not yet in DOM)
            } finally {
                if (!cancelled) setIsLoaded(true)
            }
        }
        tryDecode()
        return () => {
            cancelled = true
        }
    }, [currentSrc])

    const wrapperStyle = {
        position: 'relative',
        display: 'block',
        overflow: 'hidden',
        borderRadius: style?.borderRadius,
        width,
        height,
        ...style
    }

    const imgStyle = {
        width: '100%',
        height: '100%',
        objectFit: style?.objectFit || 'cover',
        transform: 'translateZ(0)',
        willChange: 'opacity',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 300ms ease',
        display: 'block'
    }

    const placeholderStyle = {
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(90deg, rgba(0,0,0,0.08), rgba(0,0,0,0.14), rgba(0,0,0,0.08))',
        backgroundSize: '200% 100%',
        animation: 'lazyimg-shimmer 1.2s ease-in-out infinite',
        filter: 'blur(8px)'
    }

    return (
        <span className={className} style={wrapperStyle}>
            {!isLoaded && <span aria-hidden="true" style={placeholderStyle} />}
            { /* src boş string olmasın: undefined/null ver */}
            <img
                ref={imgRef}
                src={currentSrc || undefined}
                alt={alt}
                loading={loading}
                decoding="async"
                fetchPriority={fetchPriority ?? fetchpriority}
                sizes={sizes}
                srcSet={srcSet}
                style={imgStyle}
            />
            {/* Keyframes inline to avoid external CSS */}
            <style>
                {`
          @keyframes lazyimg-shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}
            </style>
        </span>
    )
}

export default LazyImg


