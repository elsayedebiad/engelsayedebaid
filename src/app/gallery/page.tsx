'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { 
  ArrowLeft, 
  Eye, 
  MessageCircle, 
  Download, 
  Search, 
  Filter, 
  Grid3X3, 
  List, 
  Archive
} from 'lucide-react'
// إزالة DashboardLayout للسماح بالوصول بدون تسجيل دخول
import CountryFlag from '../../components/CountryFlag'

interface CV {
  id: string
  fullName: string
  fullNameArabic?: string
  nationality?: string
  position?: string
  age?: number
  profileImage?: string
  phone?: string
  referenceCode?: string
}

export default function GalleryPage() {
  const router = useRouter()
  const [cvs, setCvs] = useState<CV[]>([])
  const [filteredCvs, setFilteredCvs] = useState<CV[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [selectedNationality, setSelectedNationality] = useState<string>('ALL')
  const [selectedCvs, setSelectedCvs] = useState<string[]>([])
  const [isDownloading, setIsDownloading] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [currentDownloadName, setCurrentDownloadName] = useState('')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userInfo, setUserInfo] = useState<{name: string, email: string, role: string} | null>(null)

  const whatsappNumber = '+201065201900'

  // التحقق من حالة تسجيل الدخول وصحة الـ token
  useEffect(() => {
    const checkAuthStatus = async () => {
      const token = localStorage.getItem('token')
      if (token) {
        try {
          // التحقق من صحة الـ token باستخدام /api/auth/me
          const response = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` }
          })
          if (response.ok) {
            const data = await response.json()
            setIsLoggedIn(true)
            setUserInfo(data.user)
          } else {
            // الـ token غير صالح، إزالته
            localStorage.removeItem('token')
            setIsLoggedIn(false)
          }
        } catch (error) {
          // خطأ في التحقق، إزالة الـ token
          localStorage.removeItem('token')
          setIsLoggedIn(false)
        }
      } else {
        setIsLoggedIn(false)
      }
    }
    
    checkAuthStatus()
  }, [])

  useEffect(() => {
    fetchCVs()
  }, [])

  useEffect(() => {
    filterCVs()
  }, [cvs, searchTerm, selectedNationality])

  const fetchCVs = async () => {
    try {
      // استخدام API المعرض العام بدون authentication
      const response = await fetch('/api/gallery')
      if (!response.ok) {
        throw new Error('Failed to fetch CVs')
      }
      const data = await response.json()
      // عرض جميع السير الذاتية (مع أو بدون صور)
      setCvs(data)
    } catch (error) {
      toast.error('فشل في تحميل السير الذاتية')
    } finally {
      setIsLoading(false)
    }
  }

  const filterCVs = () => {
    let filtered = cvs

    if (searchTerm) {
      const q = searchTerm.toLowerCase()
      filtered = filtered.filter(cv =>
        cv.fullName.toLowerCase().includes(q) ||
        (cv.fullNameArabic && cv.fullNameArabic.toLowerCase().includes(q)) ||
        (cv.nationality && cv.nationality.toLowerCase().includes(q)) ||
        (cv.position && cv.position.toLowerCase().includes(q)) ||
        (cv.referenceCode && cv.referenceCode.toLowerCase().includes(q))
      )
    }

    if (selectedNationality !== 'ALL') {
      filtered = filtered.filter(cv => cv.nationality === selectedNationality)
    }

    setFilteredCvs(filtered)
  }

  const sendWhatsAppMessage = (cv: CV) => {
    const message = `مرحباً، أريد حجز هذه السيرة الذاتية:

👤 الاسم: ${cv.fullName}
${cv.fullNameArabic ? `🏷️ الاسم العربي: ${cv.fullNameArabic}` : ''}
🏳️ الجنسية: ${cv.nationality || 'غير محدد'}
💼 الوظيفة: ${cv.position || 'غير محدد'}
🆔 الكود المرجعي: ${cv.referenceCode || 'غير محدد'}
📱 رقم الهاتف: ${cv.phone || 'غير محدد'}

يرجى التواصل معي لإتمام عملية الحجز.`

    const encodedMessage = encodeURIComponent(message)
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`
    
    window.open(whatsappUrl, '_blank')
  }

  const handleBulkDownload = async () => {
    if (selectedCvs.length === 0) {
      toast.error('يرجى تحديد سيرة ذاتية واحدة على الأقل للتحميل')
      return
    }

    setIsDownloading(true)
    let downloadedCount = 0

    try {
      const selectedCVsList = cvs.filter(cv => selectedCvs.includes(cv.id))

      for (const cv of selectedCVsList) {
        setCurrentDownloadName(cv.fullName || cv.referenceCode || 'السيرة الذاتية')
        const toastId = toast.loading(
          `جاري تحميل ${cv.fullName} (${downloadedCount + 1}/${selectedCVsList.length})`
        )

        try {
          const blob = await createCvImage(cv)
          if (blob) {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = `CV_${cv.fullName || cv.referenceCode || 'unknown'}.png`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)
            downloadedCount++
            setDownloadProgress((downloadedCount / selectedCVsList.length) * 100)

            // Update the toast with success
            toast.success(
              `تم تحميل ${cv.fullName} (${downloadedCount}/${selectedCVsList.length})`,
              { id: toastId }
            )
          }
        } catch (error) {
          console.error(`Error downloading image for ${cv.fullName}:`, error)
          toast.error(
            `فشل في تحميل ${cv.fullName}`,
            { id: toastId }
          )
        }

        // Add a small delay between downloads
        await new Promise(resolve => setTimeout(resolve, 800))
      }

      if (downloadedCount > 0) {
        toast.success(`تم تحميل ${downloadedCount} من الصور بنجاح`)
        setSelectedCvs([]) // Clear selection after successful downloads
      }
    } catch (error) {
      console.error('Error in bulk download:', error)
      toast.error('فشل في تحميل الصور')
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
      setCurrentDownloadName('')
    }
  }

  const toggleCvSelection = (cvId: string) => {
    setSelectedCvs(prev => 
      prev.includes(cvId) 
        ? prev.filter(id => id !== cvId)
        : [...prev, cvId]
    )
  }

  const toggleSelectAll = () => {
    if (selectedCvs.length === filteredCvs.length) {
      setSelectedCvs([])
    } else {
      setSelectedCvs(filteredCvs.map(cv => cv.id))
    }
  }

  const createCvImage = async (cv: CV): Promise<Blob | null> => {
    return new Promise(async (resolve) => {
      try {
        if (!cv.profileImage) {
          resolve(null)
          return
        }

        // تحميل الصورة الشخصية مباشرة
        const img = new Image()
        img.crossOrigin = 'anonymous'
        
        img.onload = () => {
          try {
            // إنشاء canvas بحجم مناسب
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            
            if (!ctx) {
              resolve(null)
              return
            }

            // تعيين أبعاد الـ canvas (نسبة A4)
            canvas.width = 1200
            canvas.height = 1600
            
            // خلفية بيضاء
            ctx.fillStyle = '#ffffff'
            ctx.fillRect(0, 0, canvas.width, canvas.height)
            
            // حساب أبعاد الصورة مع ترك مساحة للمعلومات
            const infoHeight = 200
            const availableHeight = canvas.height - infoHeight
            
            const imgAspectRatio = img.width / img.height
            const availableAspectRatio = canvas.width / availableHeight
            
            let drawWidth, drawHeight, drawX, drawY
            
            if (imgAspectRatio > availableAspectRatio) {
              // الصورة أعرض من المساحة المتاحة
              drawWidth = canvas.width
              drawHeight = canvas.width / imgAspectRatio
              drawX = 0
              drawY = (availableHeight - drawHeight) / 2
            } else {
              // الصورة أطول من المساحة المتاحة
              drawHeight = availableHeight
              drawWidth = availableHeight * imgAspectRatio
              drawX = (canvas.width - drawWidth) / 2
              drawY = 0
            }
            
            // رسم الصورة
            ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight)
            
            // إضافة إطار للصورة
            ctx.strokeStyle = '#e5e7eb'
            ctx.lineWidth = 2
            ctx.strokeRect(0, 0, canvas.width, canvas.height)
            
            // إضافة معلومات السيرة الذاتية في الأسفل
            const infoY = canvas.height - infoHeight
            
            // خلفية للمعلومات
            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
            ctx.fillRect(0, infoY, canvas.width, infoHeight)
            
            // خط فاصل
            ctx.strokeStyle = '#d1d5db'
            ctx.lineWidth = 1
            ctx.beginPath()
            ctx.moveTo(0, infoY)
            ctx.lineTo(canvas.width, infoY)
            ctx.stroke()
            
            // النصوص
            ctx.fillStyle = '#1f2937'
            ctx.font = 'bold 32px Arial'
            ctx.textAlign = 'center'
            
            let yPos = infoY + 40
            
            // اسم السيرة الذاتية
            if (cv.fullName) {
              ctx.fillText(cv.fullName, canvas.width / 2, yPos)
              yPos += 40
            }
            
            // الاسم العربي
            if (cv.fullNameArabic && cv.fullNameArabic !== cv.fullName) {
              ctx.font = 'bold 28px Arial'
              ctx.fillText(cv.fullNameArabic, canvas.width / 2, yPos)
              yPos += 35
            }
            
            // المعلومات الأخرى
            ctx.font = '24px Arial'
            ctx.fillStyle = '#4b5563'
            
            const info = []
            if (cv.position) info.push(`الوظيفة: ${cv.position}`)
            if (cv.nationality) info.push(`الجنسية: ${cv.nationality}`)
            if (cv.age) info.push(`العمر: ${cv.age} سنة`)
            if (cv.referenceCode) info.push(`الرقم المرجعي: ${cv.referenceCode}`)
            
            info.forEach((text, index) => {
              ctx.fillText(text, canvas.width / 2, yPos)
              yPos += 30
            })
            
            // إضافة الـ watermark في أماكن متعددة خلف البيانات
            ctx.save()
            
            // إعدادات الـ watermark
            ctx.fillStyle = 'rgba(0, 0, 0, 0.08)' // شفافية أكثر
            ctx.font = 'bold 48px Arial'
            ctx.textAlign = 'center'
            
            // تدوير النص قليلاً
            const angle = -15 * Math.PI / 180 // -15 درجة
            
            // إضافة watermarks في مواقع متعددة
            const watermarkText = 'الاسناد السريع'
            const watermarkTextEn = 'ALASNAD ALSARIE'
            
            // الموقع الأول - وسط الصورة
            ctx.save()
            ctx.translate(canvas.width / 2, canvas.height / 3)
            ctx.rotate(angle)
            ctx.fillText(watermarkText, 0, -20)
            ctx.fillText(watermarkTextEn, 0, 40)
            ctx.restore()
            
            // الموقع الثاني - يسار الصورة
            ctx.save()
            ctx.translate(canvas.width / 4, canvas.height / 2)
            ctx.rotate(angle)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'
            ctx.font = 'bold 36px Arial'
            ctx.fillText(watermarkText, 0, 0)
            ctx.restore()
            
            // الموقع الثالث - يمين الصورة
            ctx.save()
            ctx.translate(3 * canvas.width / 4, canvas.height / 2)
            ctx.rotate(angle)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.06)'
            ctx.font = 'bold 36px Arial'
            ctx.fillText(watermarkText, 0, 0)
            ctx.restore()
            
            // watermark صغير في الأسفل
            ctx.restore()
            ctx.fillStyle = 'rgba(0, 0, 0, 0.15)'
            ctx.font = 'bold 16px Arial'
            ctx.textAlign = 'center'
            const footerY = canvas.height - 10
            ctx.fillText('الاسناد السريع - ALASNAD ALSARIE - لخدمات العمالة المنزلية', canvas.width / 2, footerY)
            
            // تحويل إلى blob
            canvas.toBlob((blob) => {
              resolve(blob)
            }, 'image/png', 0.95)
            
          } catch (error) {
            resolve(null)
          }
        }
        
        img.onerror = () => {
          resolve(null)
        }
        
        img.src = cv.profileImage
        
      } catch (error) {
        resolve(null)
      }
    })
  }

  const downloadCvImage = async (cv: CV) => {
    try {
      setCurrentDownloadName(cv.fullName || cv.referenceCode || 'السيرة الذاتية')
      toast.loading('جاري إنشاء صورة السيرة الذاتية...')
      
      const blob = await createCvImage(cv)
      
      if (blob) {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = `CV_${cv.fullName || cv.referenceCode || 'unknown'}.png`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        toast.dismiss()
        toast.success('تم تحميل السيرة الذاتية بنجاح')
      } else {
        toast.dismiss()
        toast.error('فشل في إنشاء صورة السيرة الذاتية')
      }
      
    } catch (error) {
      toast.dismiss()
      toast.error('حدث خطأ أثناء إنشاء صورة السيرة الذاتية')
    } finally {
      setCurrentDownloadName('')
    }
  }

  const downloadSelectedCvs = async () => {
    if (selectedCvs.length === 0) {
      toast.error('يرجى تحديد سير ذاتية للتحميل')
      return
    }

    setIsDownloading(true)
    setDownloadProgress(0)
    const selectedCvData = filteredCvs.filter(cv => selectedCvs.includes(cv.id))
    let processedCount = 0
    const totalCount = selectedCvData.length

    try {
      // استيراد JSZip
      const JSZip = (await import('jszip')).default
      const zip = new JSZip()

      // معالجة السير الذاتية وإضافتها للـ ZIP
      for (let i = 0; i < selectedCvData.length; i++) {
        const cv = selectedCvData[i]
        const cvName = cv.fullName || cv.referenceCode || `السيرة_${i + 1}`
        setCurrentDownloadName(cvName)
        
        try {
          // إنشاء صورة السيرة الذاتية
          const blob = await createCvImage(cv)
          
          if (blob) {
            // إضافة الصورة للـ ZIP
            const fileName = `CV_${cv.fullName || cv.referenceCode || `cv_${i + 1}`}.png`
            zip.file(fileName, blob)
            processedCount++
          } else {
            // فشل في إنشاء الصورة - تجاهل صامت
          }
          
        } catch (error) {
          // معالجة صامتة للأخطاء
        }

        // تحديث شريط التقدم
        const progress = Math.round(((i + 1) / totalCount) * 100)
        setDownloadProgress(progress)
        
        // تأخير صغير بين المعالجات
        if (i < selectedCvData.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 300))
        }
      }

      // إنشاء وتحميل ملف ZIP
      if (processedCount > 0) {
        setCurrentDownloadName('جاري إنشاء ملف ZIP...')
        
        const zipBlob = await zip.generateAsync({ 
          type: 'blob',
          compression: 'DEFLATE',
          compressionOptions: { level: 6 }
        })
        
        // تحميل ملف ZIP
        const url = URL.createObjectURL(zipBlob)
        const link = document.createElement('a')
        link.href = url
        link.download = `CVs_Collection_${new Date().toISOString().split('T')[0]}.zip`
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
        
        toast.success(`تم تحميل ${processedCount} سيرة ذاتية في ملف ZIP بنجاح`)
      } else {
        toast.error('فشل في معالجة السير الذاتية')
      }
      
      setSelectedCvs([])
    } catch (error) {
      // معالجة صامتة للأخطاء العامة
      toast.error('حدث خطأ أثناء تحميل السير الذاتية')
    } finally {
      setIsDownloading(false)
      setDownloadProgress(0)
      setCurrentDownloadName('')
    }
  }

  const getUniqueNationalities = () => {
    const nationalities = cvs
      .map(cv => cv.nationality)
      .filter(nationality => nationality)
      .filter((nationality, index, array) => array.indexOf(nationality) === index)
      .sort()
    
    return nationalities as string[]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل معرض الصور...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* إشعار للمستخدم المسجل دخول */}
          {isLoggedIn && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 rounded-lg p-2">
                  <ArrowLeft className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-green-800">
                    مرحباً {userInfo?.name || 'بك'} في المعرض العام
                  </h4>
                  <p className="text-green-700 text-sm">
                    أنت مسجل دخول كـ {userInfo?.role === 'ADMIN' ? 'مدير عام' : userInfo?.role === 'SUB_ADMIN' ? 'مدير فرعي' : 'مستخدم'}. 
                    يمكنك العودة للداشبورد في أي وقت.
                  </p>
                </div>
                <button
                  onClick={() => router.push('/dashboard')}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition-colors text-sm"
                >
                  الداشبورد
                </button>
              </div>
            </div>
          )}

          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => router.push('/')}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  title="العودة للصفحة الرئيسية"
                >
                  <ArrowLeft className="h-5 w-5 text-gray-600" />
                </button>
                <div className="bg-gradient-to-r from-blue-100 to-green-100 p-3 rounded-lg">
                  <Grid3X3 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-semibold bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-transparent">
                    معرض السير الذاتية
                  </h1>
                  <p className="text-gray-600">عرض جميع السير الذاتية مع إمكانية الحجز عبر واتساب</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="bg-gray-100 px-3 py-2 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    {filteredCvs.length} سيرة ذاتية
                  </span>
                </div>
                
                {selectedCvs.length > 0 && (
                  <>
                    <div className="bg-blue-100 px-3 py-2 rounded-lg">
                      <span className="text-sm font-medium text-blue-700">
                        {selectedCvs.length} محدد
                      </span>
                    </div>
                    <div className="relative">
                      <button
                        onClick={handleBulkDownload}
                        disabled={isDownloading}
                        className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isDownloading ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                        ) : (
                          <Download className="h-4 w-4" />
                        )}
                        {isDownloading 
                          ? `جاري تحميل ${currentDownloadName}` 
                          : `تحميل ${selectedCvs.length} صور`
                        }
                      </button>
                      {isDownloading && downloadProgress > 0 && (
                        <div className="absolute left-0 bottom-0 h-1 bg-green-500 transition-all duration-300 rounded-b-lg" 
                             style={{ width: `${downloadProgress}%` }} />
                      )}
                    </div>
                  </>
                )}

                {isLoggedIn ? (
                  <button
                    onClick={() => router.push('/dashboard')}
                    className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    العودة للداشبورد
                  </button>
                ) : (
                  <button
                    onClick={() => router.push('/login')}
                    className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-4 py-2 rounded-lg font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    تسجيل الدخول للإدارة
                  </button>
                )}
                
                <div className="flex bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'grid' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <Grid3X3 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-2 rounded-md transition-colors ${
                      viewMode === 'list' 
                        ? 'bg-white text-blue-600 shadow-sm' 
                        : 'text-gray-600 hover:text-gray-800'
                    }`}
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedCvs.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 rounded-lg p-2">
                    <Grid3X3 className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-blue-800">تم تحديد {selectedCvs.length} سيرة ذاتية</h3>
                    <p className="text-blue-700 text-sm">يمكنك الآن تطبيق العمليات الجماعية</p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setSelectedCvs([])}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    disabled={isDownloading}
                  >
                    إلغاء التحديد
                  </button>
                  <button
                    onClick={downloadSelectedCvs}
                    disabled={isDownloading}
                    className="bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white px-5 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2"
                  >
                    {isDownloading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        جاري التحميل...
                      </>
                    ) : (
                      <>
                        <Archive className="h-4 w-4" />
                        تحميل ZIP ({selectedCvs.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Progress Bar */}
          {isDownloading && (
            <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 shadow-lg">
              <div className="flex items-center gap-4 mb-4">
                <div className="bg-orange-100 rounded-lg p-3">
                  <Archive className="h-6 w-6 text-orange-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 mb-1">جاري إنشاء ملف ZIP</h3>
                  <p className="text-gray-600 text-sm">يتم الآن تحميل: {currentDownloadName}</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-orange-600">{downloadProgress}%</div>
                  <div className="text-sm text-gray-500">مكتمل</div>
                </div>
              </div>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
                <div 
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-3 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${downloadProgress}%` }}
                ></div>
              </div>
              
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>تقدم التحميل</span>
                <span>{selectedCvs.length} سيرة ذاتية محددة</span>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <input
                  type="text"
                  placeholder="البحث بالاسم أو الجنسية أو الوظيفة..."
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
                <select
                  className="w-full pr-10 pl-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={selectedNationality}
                  onChange={(e) => setSelectedNationality(e.target.value)}
                >
                  <option value="ALL">جميع الجنسيات</option>
                  {getUniqueNationalities().map(nationality => (
                    <option key={nationality} value={nationality}>
                      {nationality}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Select All */}
            {filteredCvs.length > 0 && (
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    checked={selectedCvs.length === filteredCvs.length && filteredCvs.length > 0}
                    onChange={toggleSelectAll}
                  />
                  <span className="text-sm font-medium text-gray-700">
                    تحديد الكل ({filteredCvs.length} سيرة ذاتية)
                  </span>
                </label>
                
                {selectedCvs.length > 0 && (
                  <span className="text-sm text-blue-600 font-medium">
                    تم تحديد {selectedCvs.length} من {filteredCvs.length}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Gallery */}
          {filteredCvs.length === 0 ? (
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-12 text-center">
              <div className="bg-gray-100 rounded-full p-4 w-16 h-16 mx-auto mb-4">
                <Grid3X3 className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">لا توجد سير ذاتية</h3>
              <p className="text-gray-600">
                {searchTerm || selectedNationality !== 'ALL' 
                  ? 'لا توجد نتائج تطابق معايير البحث' 
                  : 'لا توجد سير ذاتية بصور متاحة حالياً'
                }
              </p>
            </div>
          ) : (
            <div className={
              viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6'
                : 'space-y-4'
            }>
              {filteredCvs.map((cv) => (
                <div
                  key={cv.id}
                  className={`bg-white rounded-lg shadow-lg border ${selectedCvs.includes(cv.id) ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'} overflow-hidden hover:shadow-xl transition-all duration-300 cursor-pointer ${
                    viewMode === 'list' ? 'flex items-center p-4' : ''
                  }`}
                >
                  {viewMode === 'grid' ? (
                    <>
                      {/* صورة السيرة الذاتية */}
                      <div className="aspect-[3/4] relative overflow-hidden bg-gray-200">
                        {cv.profileImage ? (
                          <img
                            src={cv.profileImage}
                            alt={cv.fullName}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              // إذا فشل تحميل الصورة، استخدم صورة افتراضية
                              const target = e.target as HTMLImageElement
                              target.src = '/api/placeholder/avatar'
                              target.onerror = () => {
                                // إذا فشلت الصورة الافتراضية أيضاً، أخفي العنصر
                                target.style.display = 'none'
                                const parent = target.parentElement
                                if (parent) {
                                  parent.innerHTML = `
                                    <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                      <div class="text-white text-center">
                                        <div class="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                          <svg class="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd" />
                                          </svg>
                                        </div>
                                        <p class="text-sm font-medium">${cv.fullName}</p>
                                      </div>
                                    </div>
                                  `
                                }
                              }
                            }}
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <div className="text-white text-center">
                              <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-2">
                                <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                                  <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                                </svg>
                              </div>
                              <p className="text-sm font-medium">{cv.fullName}</p>
                            </div>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <CountryFlag nationality={cv.nationality || ''} size="sm" />
                        </div>
                        <div className="absolute top-2 left-2">
                          <input
                            type="checkbox"
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 bg-white"
                            checked={selectedCvs.includes(cv.id)}
                            onChange={() => toggleCvSelection(cv.id)}
                          />
                        </div>
                        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                          <h3 className="text-white font-semibold text-sm mb-1">{cv.fullName}</h3>
                          {cv.fullNameArabic && (
                            <p className="text-white/80 text-xs mb-1">{cv.fullNameArabic}</p>
                          )}
                          <p className="text-white/70 text-xs">{cv.position || 'غير محدد'}</p>
                        </div>
                      </div>
                      
                      {/* معلومات السيرة */}
                      <div className="p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                            {cv.referenceCode}
                          </span>
                          {cv.age && (
                            <span className="text-xs text-gray-500">{cv.age} سنة</span>
                          )}
                        </div>
                        
                        <div className="flex gap-1">
                          <button
                            onClick={() => sendWhatsAppMessage(cv)}
                            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 transition-colors"
                          >
                            <MessageCircle className="h-3 w-3" />
                            حجز
                          </button>
                          <button
                            onClick={() => downloadCvImage(cv)}
                            className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-2 rounded-lg text-xs flex items-center justify-center transition-colors"
                            title="تحميل السيرة الذاتية"
                          >
                            <Download className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => router.push(`/gallery/cv/${cv.id}`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-2 rounded-lg text-xs flex items-center justify-center transition-colors"
                            title="عرض السيرة الكاملة"
                          >
                            <Eye className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      {/* عرض القائمة */}
                      <input
                        type="checkbox"
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 flex-shrink-0"
                        checked={selectedCvs.includes(cv.id)}
                        onChange={() => toggleCvSelection(cv.id)}
                      />
                      <div className="w-20 h-24 flex-shrink-0 relative overflow-hidden rounded-lg">
                        <img
                          src={cv.profileImage}
                          alt={cv.fullName}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      
                      <div className="flex-1 mr-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-800">{cv.fullName}</h3>
                            {cv.fullNameArabic && (
                              <p className="text-sm text-gray-600">{cv.fullNameArabic}</p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <CountryFlag nationality={cv.nationality || ''} size="sm" />
                              <span className="text-sm text-gray-500">{cv.position || 'غير محدد'}</span>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-1 rounded">
                              {cv.referenceCode}
                            </span>
                            {cv.age && (
                              <span className="text-xs text-gray-500">{cv.age} سنة</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex gap-2 mt-3">
                          <button
                            onClick={() => sendWhatsAppMessage(cv)}
                            className="bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                            حجز عبر واتساب
                          </button>
                          <button
                            onClick={() => downloadCvImage(cv)}
                            className="bg-orange-600 hover:bg-orange-700 text-white py-2 px-3 rounded-lg text-sm flex items-center gap-2 transition-colors"
                            title="تحميل السيرة الذاتية PNG"
                          >
                            <Download className="h-4 w-4" />
                            تحميل CV
                          </button>
                          <button
                            onClick={() => router.push(`/dashboard/cv/${cv.id}/alqaeid`)}
                            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded-lg text-sm flex items-center gap-2 transition-colors"
                          >
                            <Eye className="h-4 w-4" />
                            عرض التفاصيل
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
