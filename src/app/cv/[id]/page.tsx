'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { toast } from 'react-hot-toast'
import { Share2, MessageCircle, ArrowLeft, Image as ImageIcon } from 'lucide-react'
import QSOTemplate from '../../../components/cv-templates/qso-template'
import Head from 'next/head'
import { processImageUrl } from '@/lib/url-utils'
import DownloadProgressModal from '@/components/DownloadProgressModal'
import Image from 'next/image'

// Interface شامل للسيرة الذاتية
interface CV {
  id: string;
  fullName: string;
  fullNameArabic?: string;
  email?: string;
  phone?: string;
  referenceCode?: string;
  position?: string;
  nationality?: string;
  religion?: string;
  dateOfBirth?: string;
  placeOfBirth?: string;
  livingTown?: string;
  maritalStatus?: string;
  numberOfChildren?: number;
  weight?: string;
  height?: string;
  complexion?: string;
  age?: number;
  monthlySalary?: string;
  contractPeriod?: string;
  passportNumber?: string;
  passportIssueDate?: string;
  passportExpiryDate?: string;
  passportIssuePlace?: string;
  englishLevel?: string;
  arabicLevel?: string;
  educationLevel?: string;
  babySitting?: string;
  childrenCare?: string;
  tutoring?: string;
  disabledCare?: string;
  cleaning?: string;
  washing?: string;
  ironing?: string;
  arabicCooking?: string;
  sewing?: string;
  driving?: string;
  elderCare?: string;
  housekeeping?: string;
  experience?: string;
  education?: string;
  skills?: string;
  summary?: string;
  priority?: string;
  notes?: string;
  profileImage?: string;
  cvImageUrl?: string; // رابط صورة السيرة الكاملة المصممة
  videoLink?: string;
  // الحقول الإضافية الـ 22
  previousEmployment?: string;
  workExperienceYears?: number;
  lastEmployer?: string;
  reasonForLeaving?: string;
  contractType?: string;
  expectedSalary?: string;
  workingHours?: string;
  languages?: string;
  medicalCondition?: string;
  hobbies?: string;
  personalityTraits?: string;
  foodPreferences?: string;
  specialNeeds?: string;
  currentLocation?: string;
  availability?: string;
  preferredCountry?: string;
  visaStatus?: string;
  workPermit?: string;
  certificates?: string;
  references?: string;
  emergencyContact?: string;
}

export default function PublicCVPage() {
  const params = useParams()
  const [cv, setCv] = useState<CV | null>(null)
  const [loading, setLoading] = useState(true)
  const [imageLoading, setImageLoading] = useState(true)
  const [imageError, setImageError] = useState(false)
  const [imageRetryCount, setImageRetryCount] = useState(0)
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('')
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(0.5) // مستوى الزوم الافتراضي
  
  // Download modal states
  const [downloadModalOpen, setDownloadModalOpen] = useState(false)
  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadStatus, setDownloadStatus] = useState<'preparing' | 'downloading' | 'success' | 'error'>('preparing')
  const [downloadFileName, setDownloadFileName] = useState('')
  const [downloadError, setDownloadError] = useState('')

  useEffect(() => {
    if (params.id) {
      fetchCV(params.id as string)
    }
  }, [params.id])

  // دالة لاستخراج FILE_ID من روابط Google Drive المختلفة
  const extractGoogleDriveFileId = (url: string): string | null => {
    if (!url) return null
    
    // Pattern 1: /file/d/FILE_ID/view
    const match1 = url.match(/\/file\/d\/([^\/]+)/)
    if (match1) return match1[1]
    
    // Pattern 2: /open?id=FILE_ID
    const match2 = url.match(/[?&]id=([^&]+)/)
    if (match2) return match2[1]
    
    // Pattern 3: /thumbnail?id=FILE_ID
    const match3 = url.match(/\/thumbnail\?id=([^&]+)/)
    if (match3) return match3[1]
    
    // Pattern 4: /uc?id=FILE_ID or /uc?export=view&id=FILE_ID
    const match4 = url.match(/\/uc\?.*id=([^&]+)/)
    if (match4) return match4[1]
    
    // Pattern 5: lh3.googleusercontent.com/d/FILE_ID
    const match5 = url.match(/lh3\.googleusercontent\.com\/d\/([^=?&]+)/)
    if (match5) return match5[1]
    
    // Pattern 6: رابط مباشر للـ FILE_ID (25+ حرف/رقم)
    const match6 = url.match(/[-\w]{25,}/)
    if (match6) return match6[0]
    
    return null
  }

  // إعادة تعيين حالة التحميل عند تغيير الصورة وإعداد URL
  useEffect(() => {
    if (cv?.cvImageUrl) {
      setImageLoading(true)
      setImageError(false)
      setImageRetryCount(0)
      
      console.log('📎 الرابط الأصلي:', cv.cvImageUrl)
      
      // استخراج FILE_ID وتحويله لرابط مباشر
      const fileId = extractGoogleDriveFileId(cv.cvImageUrl)
      
      if (fileId) {
        // استخدم خدمة proxy موثوقة لعرض صور Google Drive
        const googleDriveDirectUrl = `https://drive.google.com/uc?export=view&id=${fileId}`
        const proxyUrl = `https://images.weserv.nl/?url=${encodeURIComponent(googleDriveDirectUrl)}&w=2000&output=webp`
        setCurrentImageUrl(proxyUrl)
        console.log('🔍 تم استخراج File ID:', fileId)
        console.log('🔗 استخدام Proxy:', proxyUrl)
      } else {
        // إذا لم يكن Google Drive، استخدم الرابط الأصلي
        setCurrentImageUrl(cv.cvImageUrl)
        console.log('ℹ️ استخدام الرابط الأصلي (ليس Google Drive)')
      }
    }
  }, [cv?.cvImageUrl])

  // دالة لتجربة روابط بديلة عند فشل التحميل
  const tryAlternativeUrl = () => {
    if (!cv?.cvImageUrl) return

    const fileId = extractGoogleDriveFileId(cv.cvImageUrl)
    
    // جرب روابط بديلة بالترتيب
    const alternativeUrls: string[] = []
    
    // إذا كان رابط Google Drive، جرب صيغ مختلفة مع proxy
    if (fileId) {
      const directUrl1 = `https://drive.google.com/uc?export=view&id=${fileId}`
      const directUrl2 = `https://lh3.googleusercontent.com/d/${fileId}`
      const directUrl3 = `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`
      
      alternativeUrls.push(
        `https://images.weserv.nl/?url=${encodeURIComponent(directUrl1)}&w=2000&output=webp`, // Proxy 1
        `https://wsrv.nl/?url=${encodeURIComponent(directUrl1)}&w=2000`, // Proxy 2 (short)
        directUrl1, // رابط مباشر 1
        `https://lh3.googleusercontent.com/d/${fileId}=w2000`, // Googleusercontent
        directUrl2, // رابط مباشر 2
        directUrl3, // thumbnail
        `https://drive.google.com/uc?id=${fileId}`, // UC بدون export
      )
    } else {
      // إذا لم يكن Google Drive
      alternativeUrls.push(cv.cvImageUrl)
    }

    if (imageRetryCount < alternativeUrls.length - 1) {
      const nextRetry = imageRetryCount + 1
      console.log(`🔄 محاولة رابط بديل (${nextRetry}/${alternativeUrls.length}):`, alternativeUrls[nextRetry])
      setImageRetryCount(nextRetry)
      setCurrentImageUrl(alternativeUrls[nextRetry])
      setImageLoading(true)
      setImageError(false)
    } else {
      console.error('❌ فشلت جميع المحاولات لتحميل الصورة')
      setImageError(true)
    }
  }

  const fetchCV = async (id: string) => {
    try {
      const response = await fetch(`/api/cvs/${id}/public`)
      
      if (response.ok) {
        const data = await response.json()
        setCv(data.cv)
      } else {
        toast.error('السيرة الذاتية غير موجودة')
      }
    } catch (error) {
      toast.error('حدث خطأ أثناء تحميل البيانات')
    } finally {
      setLoading(false)
    }
  }

  const handleShare = async () => {
    const url = window.location.href
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `سيرة ذاتية - ${cv?.fullName}`,
          text: `شاهد السيرة الذاتية لـ ${cv?.fullName}`,
          url: url
        })
      } catch (error) {
        // إذا فشلت المشاركة، انسخ الرابط
        copyToClipboard(url)
      }
    } else {
      copyToClipboard(url)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
    }).catch(() => {
      toast.error('فشل في نسخ الرابط')
    })
  }

  const handleWhatsAppShare = () => {
    if (!cv) return
    
    const message = `مرحباً، أريد الاستفسار عن السيرة الذاتية لـ ${cv.fullName}
    
الرقم المرجعي: ${cv.referenceCode || 'غير محدد'}
الوظيفة: ${cv.position || 'غير محدد'}
الجنسية: ${cv.nationality || 'غير محدد'}

رابط السيرة الذاتية: ${window.location.href}`

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`
    window.open(whatsappUrl, '_blank')
  }

  const handleDownloadImage = async () => {
    if (!cv?.id) {
      toast.error('معرف السيرة الذاتية غير موجود')
      return
    }

    // تحضير اسم الملف
    const fileName = `السيرة_الذاتية_${cv.fullName || 'CV'}_${cv.referenceCode || ''}`
      .replace(/[\\/:*?"<>|]+/g, '-')
      .replace(/\s+/g, '_')
    
    setDownloadFileName(fileName + '.png')
    setDownloadModalOpen(true)
    setDownloadStatus('preparing')
    setDownloadProgress(0)
    setDownloadError('')

    try {
      // إذا كانت هناك صورة سيرة مصممة مسبقاً (من Google Drive)
      if (cv.cvImageUrl) {
        setDownloadStatus('downloading')
        setDownloadProgress(10)
        
        console.log('🔄 بدء تحميل صورة السيرة من:', cv.cvImageUrl)

        // استخراج File ID من Google Drive
        const fileId = extractGoogleDriveFileId(cv.cvImageUrl)
        
        if (fileId) {
          console.log('🔍 File ID:', fileId)
          
          // استخدام رابط التحميل المباشر من Google Drive
          console.log('📥 استخدام رابط التحميل المباشر من Google Drive')
          setDownloadProgress(50)
          
          const downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`
          console.log('🔗 رابط التحميل:', downloadUrl)
          
          // محاولة التحميل بطريقتين
          setDownloadProgress(70)
          
          // الطريقة 1: استخدام رابط تحميل مباشر
          try {
            const link = document.createElement('a')
            link.href = downloadUrl
            link.download = fileName + '.jpg'
            link.style.display = 'none'
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            
            setDownloadProgress(100)
            setDownloadStatus('success')
            toast.success('تم بدء تحميل الصورة من Google Drive')
            console.log('✅ تم بدء التحميل باستخدام رابط مباشر')
            
            // backup: استخدام iframe للتأكيد
            setTimeout(() => {
              const iframe = document.createElement('iframe')
              iframe.style.display = 'none'
              iframe.style.position = 'absolute'
              iframe.style.width = '1px'
              iframe.style.height = '1px'
              iframe.src = downloadUrl
              document.body.appendChild(iframe)
              
              setTimeout(() => {
                if (iframe.parentNode) {
                  document.body.removeChild(iframe)
                }
              }, 20000)
            }, 500)
            
            return
          } catch (linkError) {
            console.warn('⚠️ فشل التحميل بالرابط، استخدام iframe:', linkError)
            
            // الطريقة 2: استخدام iframe فقط
            const iframe = document.createElement('iframe')
            iframe.style.display = 'none'
            iframe.style.position = 'absolute'
            iframe.style.width = '1px'
            iframe.style.height = '1px'
            iframe.src = downloadUrl
            document.body.appendChild(iframe)
            
            setDownloadProgress(100)
            setDownloadStatus('success')
            
            setTimeout(() => {
              if (iframe.parentNode) {
                document.body.removeChild(iframe)
              }
            }, 20000)
            
            toast.success('تم بدء تحميل الصورة من Google Drive')
            console.log('✅ تم بدء التحميل باستخدام iframe')
            return
          }
        } else {
          // إذا لم نستطع استخراج File ID، استخدم الرابط الأصلي
          console.warn('⚠️ لم نتمكن من استخراج File ID، استخدام الرابط الأصلي')
          const iframe = document.createElement('iframe')
          iframe.style.display = 'none'
          iframe.style.position = 'absolute'
          iframe.style.width = '0'
          iframe.style.height = '0'
          iframe.src = cv.cvImageUrl
          document.body.appendChild(iframe)
          
          setDownloadProgress(100)
          setDownloadStatus('success')
          
          setTimeout(() => {
            if (iframe.parentNode) {
              document.body.removeChild(iframe)
            }
          }, 15000)
          
          toast.success('تم بدء تحميل الصورة')
          return
        }
      } else {
        // لا توجد صورة من Google Drive
        setDownloadProgress(100)
        setDownloadStatus('error')
        setDownloadError('لا توجد صورة لتحميلها. يرجى إضافة رابط صورة من Google Drive أولاً.')
        toast.error('لا توجد صورة لتحميلها')
        return
      }
      
    } catch (error) {
      console.error('❌ خطأ في تنزيل الصورة:', error)
      setDownloadStatus('error')
      setDownloadError(error instanceof Error ? error.message : 'حدث خطأ أثناء التحميل')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
            <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">جاري تحميل السيرة الذاتية...</h3>
          <p className="text-muted-foreground">يرجى الانتظار</p>
        </div>
      </div>
    )
  }

  if (!cv) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md mx-auto">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
            <svg className="w-10 h-10 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-foreground mb-4">السيرة الذاتية غير موجودة</h1>
          <p className="text-muted-foreground mb-6">الرابط الذي تحاول الوصول إليه غير صحيح أو تم حذف السيرة الذاتية</p>
          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            العودة للخلف
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </Head>
      <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card shadow-sm border-b border-border sticky top-0 z-40 backdrop-blur-sm bg-card/95">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {cv.fullName}
              </h1>
              <p className="text-muted-foreground">
                {cv.position && `${cv.position} • `}
                {cv.nationality && `${cv.nationality} • `}
                {cv.referenceCode && `#${cv.referenceCode}`}
              </p>
            </div>
            
            <div className="flex items-center gap-3">
              {/* أزرار التحكم في الزوم - تظهر فقط عند عدم وجود cvImageUrl */}
              {!cv.cvImageUrl && (
                <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setZoomLevel(Math.max(0.2, zoomLevel - 0.1))}
                    className="bg-background text-foreground px-3 py-2 rounded-md hover:bg-accent transition-colors flex items-center"
                    title="تصغير"
                  >
                    <span className="text-lg">-</span>
                  </button>
                  <span className="text-sm font-medium text-foreground px-2">
                    {Math.round(zoomLevel * 100)}%
                  </span>
                  <button
                    onClick={() => setZoomLevel(Math.min(1, zoomLevel + 0.1))}
                    className="bg-background text-foreground px-3 py-2 rounded-md hover:bg-accent transition-colors flex items-center"
                    title="تكبير"
                  >
                    <span className="text-lg">+</span>
                  </button>
                </div>
              )}
              
              <button
                onClick={handleShare}
                className="bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors flex items-center shadow-sm"
              >
                <Share2 className="h-4 w-4 ml-2" />
                مشاركة
              </button>
              
              <button
                onClick={handleWhatsAppShare}
                className="bg-success text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center shadow-sm"
              >
                <MessageCircle className="h-4 w-4 ml-2" />
                واتساب
              </button>
              
              <button
                onClick={handleDownloadImage}
                className="bg-warning text-white px-4 py-2 rounded-lg hover:opacity-90 transition-colors flex items-center shadow-sm"
              >
                <ImageIcon className="h-4 w-4 ml-2" />
                تحميل صورة
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CV Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {cv.cvImageUrl ? (
          /* عرض صورة السيرة المصممة مسبقاً */
          <div className="flex justify-center">
            <div className="relative inline-block w-full max-w-4xl">
              {/* Loading Skeleton */}
              {imageLoading && (
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-card rounded-lg border border-border shadow-lg">
                  <div className="text-center p-12">
                    {/* Animated spinner */}
                    <div className="relative w-20 h-20 mx-auto mb-6">
                      <div className="absolute inset-0 rounded-full border-4 border-muted"></div>
                      <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                    </div>
                    
                    {/* Loading text */}
                    <h3 className="text-lg font-semibold text-foreground mb-2">جاري تحميل السيرة الذاتية...</h3>
                    <p className="text-sm text-muted-foreground mb-4">يرجى الانتظار، جاري تحميل الصورة من Google Drive</p>
                    
                    {/* Animated progress bar */}
                    <div className="w-64 h-2 bg-muted rounded-full overflow-hidden mx-auto">
                      <div className="h-full bg-gradient-to-r from-primary to-primary/60 animate-pulse rounded-full" style={{ width: '60%' }}></div>
                    </div>
                    
                    {/* Loading tips */}
                    <div className="mt-6 text-xs text-muted-foreground">
                      <p>💡 قد يستغرق التحميل بضع ثوانٍ حسب سرعة الإنترنت</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error State */}
              {imageError && (
                <div className="max-w-2xl mx-auto">
                  <div className="p-8 bg-warning/10 border-2 border-warning/30 rounded-lg text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-warning/20 flex items-center justify-center">
                      <svg className="w-8 h-8 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-bold text-foreground mb-3">📸 صورة السيرة الذاتية</h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Google Drive يمنع العرض المباشر للصور. يمكنك فتح الصورة في نافذة جديدة أو تحميلها مباشرة.
                    </p>
                    
                    <div className="bg-card border border-border rounded-lg p-4 mb-6">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-right flex-1">
                          <p className="text-sm font-semibold text-foreground mb-1">
                            📄 {cv.fullName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            مخزنة على Google Drive
                          </p>
                        </div>
                        <svg className="w-8 h-8 text-blue-500" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M12.01 2.011a3.2 3.2 0 011.443.322L22.6 7.06a1.984 1.984 0 011.085 1.778v6.324c0 .75-.418 1.439-1.085 1.778l-9.147 4.727a3.2 3.2 0 01-2.886 0l-9.147-4.727a1.984 1.984 0 01-1.085-1.778V8.838c0-.75.418-1.439 1.085-1.778L10.567 2.333a3.2 3.2 0 011.443-.322z"/>
                        </svg>
                      </div>
                    </div>
                    
                    <div className="flex gap-3 flex-wrap justify-center">
                      <button
                        onClick={() => window.open(cv.cvImageUrl, '_blank')}
                        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-lg flex items-center gap-2 font-semibold"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                        </svg>
                        فتح الصورة
                      </button>
                      <button
                        onClick={handleDownloadImage}
                        className="px-8 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-lg flex items-center gap-2 font-semibold"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        تحميل الصورة
                      </button>
                      <button
                        onClick={() => window.location.reload()}
                        className="px-8 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors flex items-center gap-2"
                      >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        إعادة المحاولة
                      </button>
                    </div>
                  </div>
                  
                  <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <p className="text-sm text-blue-900 dark:text-blue-100 text-center">
                      💡 <strong>نصيحة:</strong> للعرض المباشر، يُفضل رفع الصورة على خدمة مثل <strong>Imgur</strong> أو <strong>ImgBB</strong> بدلاً من Google Drive
                    </p>
                  </div>
                </div>
              )}

              {/* CV Image */}
              {currentImageUrl && !imageError && (
                <div className="relative w-full flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    key={currentImageUrl}
                    src={currentImageUrl}
                    alt={`سيرة ذاتية - ${cv.fullName}`}
                    className={`max-w-full h-auto shadow-2xl rounded-lg border border-border transition-opacity duration-500 ${
                      imageLoading ? 'opacity-0' : 'opacity-100'
                    }`}
                    style={{ 
                      maxHeight: '2000px',
                      width: 'auto',
                      objectFit: 'contain'
                    }}
                    onLoad={() => {
                      console.log('✅ تم تحميل صورة السيرة بنجاح من:', currentImageUrl)
                      setImageLoading(false)
                      setImageError(false)
                    }}
                    onError={(e) => {
                      console.error(`❌ فشل تحميل صورة السيرة (محاولة ${imageRetryCount + 1}):`, currentImageUrl)
                      setImageLoading(false)
                      // جرب رابط بديل
                      tryAlternativeUrl()
                    }}
                  />
                </div>
              )}
              
              {/* Badge */}
              {!imageLoading && !imageError && (
                <div className="absolute top-4 right-4 bg-primary/90 backdrop-blur px-4 py-2 rounded-full text-sm text-primary-foreground shadow-lg flex items-center gap-2">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                  </svg>
                  صورة السيرة الكاملة
                </div>
              )}
            </div>
          </div>
        ) : (
          /* عرض template السيرة الذاتية الافتراضي */
          <div className="cv-wrapper">
            <div style={{ 
              '--zoom-level': zoomLevel,
              marginBottom: `${-2048 * (1 - zoomLevel)}px`
            } as React.CSSProperties}>
              <QSOTemplate 
                cv={cv} 
                selectedVideo={selectedVideo}
                setSelectedVideo={setSelectedVideo}
              />
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="bg-white border-t mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center text-gray-600">
            <p className="mb-4">نظام إدارة السير الذاتية - قالب QSO</p>
            <div className="flex justify-center space-x-6 space-x-reverse">
              <button
                onClick={handleShare}
                className="text-blue-600 hover:text-blue-700 flex items-center"
              >
                <Share2 className="h-4 w-4 ml-1" />
                مشاركة السيرة
              </button>
              <button
                onClick={handleWhatsAppShare}
                className="text-green-600 hover:text-green-700 flex items-center"
              >
                <MessageCircle className="h-4 w-4 ml-1" />
                تواصل عبر واتساب
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Cairo Font and Emoji Support */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;500;600;700;800;900&display=swap');
        @import url('https://fonts.googleapis.com/css2?family=Noto+Color+Emoji&display=swap');
        
        .cv-container {
          font-family: 'Cairo', 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Twemoji Mozilla', Arial, sans-serif !important;
        }
        
        /* Responsive CV Wrapper */
        .cv-wrapper {
          max-width: 100%;
          display: flex;
          justify-content: center;
          overflow: hidden;
        }
        
        .cv-wrapper > div {
          transform: scale(var(--zoom-level, 0.5));
          transform-origin: top center;
          width: 1459px;
          transition: transform 0.3s ease;
        }
        
        /* Enhanced Emoji support */
        .emoji, [class*="emoji"] {
          font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'Twemoji Mozilla', sans-serif !important;
          font-style: normal !important;
          font-variant: normal !important;
          text-rendering: optimizeLegibility !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
          font-feature-settings: "liga" 1, "kern" 1 !important;
        }
        
        /* Force emoji rendering */
        span:has-emoji, div:has-emoji {
          font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji' !important;
        }
        
        /* Specific flag emoji support */
        .flag-emoji {
          font-family: 'Segoe UI Emoji', 'Apple Color Emoji', 'Noto Color Emoji', 'EmojiOne Color', 'Android Emoji' !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          font-variant-emoji: emoji !important;
          text-rendering: optimizeLegibility !important;
        }
        
        /* Force emoji display */
        .flag-emoji * {
          font-family: inherit !important;
          font-size: inherit !important;
        }
      `}</style>
      </div>

      {/* Download Progress Modal */}
      <DownloadProgressModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        progress={downloadProgress}
        status={downloadStatus}
        fileName={downloadFileName}
        errorMessage={downloadError}
      />
    </>
  )
}
