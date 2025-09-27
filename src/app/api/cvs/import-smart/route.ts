import { NextRequest, NextResponse } from 'next/server'
import * as XLSX from 'xlsx'
import { PrismaClient } from '@prisma/client'
import { NotificationService } from '@/lib/notification-service'

const prisma = new PrismaClient()

// Interface for Excel data
interface ExcelRow {
  'الاسم الكامل'?: string
  'الاسم بالعربية'?: string
  'البريد الإلكتروني'?: string
  'رقم الهاتف'?: string
  'الكود المرجعي'?: string
  'الراتب الشهري'?: string
  'مدة العقد'?: string
  'الوظيفة المطلوبة'?: string
  'رقم الجواز'?: string
  'تاريخ إصدار الجواز'?: string
  'تاريخ انتهاء الجواز'?: string
  'مكان إصدار الجواز'?: string
  'الجنسية'?: string
  'الديانة'?: string
  'تاريخ الميلاد'?: string
  'مكان الميلاد'?: string
  'مكان السكن'?: string
  'الحالة الاجتماعية'?: string
  'عدد الأطفال'?: string
  'الوزن'?: string
  'الطول'?: string
  'لون البشرة'?: string
  'العمر'?: string
  'الإنجليزية'?: string
  'العربية'?: string
  'الدرجة العلمية'?: string
  'رعاية الأطفال'?: string
  'كي الملابس'?: string
  'العناية بالوالدين'?: string
  'الطبخ'?: string
  'العمل المنزلي'?: string
  'التنظيف'?: string
  'الغسيل'?: string
  'الطبخ العربي'?: string
  'الخياطة'?: string
  'القيادة'?: string
  'تعليم الأطفال'?: string
  'رعاية المعوقين'?: string
  'رعاية المسنين'?: string
  'التدبير المنزلي'?: string
  'الخبرة في الخارج'?: string
  'الصورة الشخصية'?: string
  'الأولوية'?: string
  'ملاحظات'?: string
}

// Interface for processed CV data
interface ProcessedCV {
  rowNumber: number
  fullName: string
  fullNameArabic?: string
  email?: string
  phone?: string
  referenceCode?: string
  monthlySalary?: string
  contractPeriod?: string
  position?: string
  passportNumber?: string
  passportIssueDate?: string
  passportExpiryDate?: string
  passportIssuePlace?: string
  nationality?: string
  religion?: string
  dateOfBirth?: string
  placeOfBirth?: string
  livingTown?: string
  maritalStatus?: 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED'
  numberOfChildren?: number
  weight?: string
  height?: string
  complexion?: string
  age?: number
  englishLevel?: 'YES' | 'NO' | 'WILLING'
  arabicLevel?: 'YES' | 'NO' | 'WILLING'
  educationLevel?: string
  babySitting?: 'YES' | 'NO' | 'WILLING'
  childrenCare?: 'YES' | 'NO' | 'WILLING'
  tutoring?: 'YES' | 'NO' | 'WILLING'
  disabledCare?: 'YES' | 'NO' | 'WILLING'
  cleaning?: 'YES' | 'NO' | 'WILLING'
  washing?: 'YES' | 'NO' | 'WILLING'
  ironing?: 'YES' | 'NO' | 'WILLING'
  arabicCooking?: 'YES' | 'NO' | 'WILLING'
  sewing?: 'YES' | 'NO' | 'WILLING'
  driving?: 'YES' | 'NO' | 'WILLING'
  elderCare?: 'YES' | 'NO' | 'WILLING'
  housekeeping?: 'YES' | 'NO' | 'WILLING'
  cooking?: 'YES' | 'NO' | 'WILLING'
  experience?: string
  education?: string
  skills?: string
  summary?: string
  priority?: 'HIGH' | 'MEDIUM' | 'LOW'
  notes?: string
  isUpdate: boolean
  existingId?: number
  duplicateReason?: string
}

// Interface for import results
interface ImportResult {
  totalRows: number
  newRecords: number
  updatedRecords: number
  skippedRecords: number
  errorRecords: number
  details: {
    newCVs: ProcessedCV[]
    updatedCVs: ProcessedCV[]
    skippedCVs: ProcessedCV[]
    errorCVs: ProcessedCV[]
  }
  summary: string
}

// Helper function to normalize skill levels
const normalizeSkillLevel = (value?: string): 'YES' | 'NO' | 'WILLING' | undefined => {
  if (!value) return undefined
  const normalized = value.toString().trim().toUpperCase()
  if (normalized === 'YES' || normalized === 'نعم' || normalized === '1') return 'YES'
  if (normalized === 'NO' || normalized === 'لا' || normalized === '0') return 'NO'
  if (normalized === 'WILLING' || normalized === 'راغب' || normalized === 'مستعد') return 'WILLING'
  return undefined
}

// Helper function to normalize marital status
const normalizeMaritalStatus = (value?: string): 'SINGLE' | 'MARRIED' | 'DIVORCED' | 'WIDOWED' | undefined => {
  if (!value) return undefined
  const normalized = value.toString().trim().toUpperCase()
  if (normalized === 'SINGLE' || normalized === 'أعزب' || normalized === 'عزباء') return 'SINGLE'
  if (normalized === 'MARRIED' || normalized === 'متزوج' || normalized === 'متزوجة') return 'MARRIED'
  if (normalized === 'DIVORCED' || normalized === 'مطلق' || normalized === 'مطلقة') return 'DIVORCED'
  if (normalized === 'WIDOWED' || normalized === 'أرمل' || normalized === 'أرملة') return 'WIDOWED'
  return undefined
}

// Helper function to normalize priority
const normalizePriority = (value?: string): 'HIGH' | 'MEDIUM' | 'LOW' => {
  if (!value) return 'MEDIUM'
  const normalized = value.toString().trim().toUpperCase()
  if (normalized === 'HIGH' || normalized === 'عالية' || normalized === 'مرتفعة') return 'HIGH'
  if (normalized === 'LOW' || normalized === 'منخفضة' || normalized === 'قليلة') return 'LOW'
  return 'MEDIUM'
}

// Helper function to check for duplicate CVs
const checkForDuplicates = async (cv: ProcessedCV) => {
  try {
    // فحص التكرار بناءً على رقم جواز السفر فقط
    if (cv.passportNumber && cv.passportNumber.trim()) {
      const existingByPassport = await prisma.cV.findFirst({
        where: { passportNumber: cv.passportNumber.trim() }
      })
      if (existingByPassport) {
        return { 
          isDuplicate: true, 
          existingId: existingByPassport.id, 
          reason: 'رقم جواز السفر مطابق' 
        }
      }
    }

    // إذا لم يكن هناك رقم جواز، فلا يوجد تكرار
    return { isDuplicate: false }
  } catch (error) {
    console.error('Error checking duplicates:', error)
    return { isDuplicate: false }
  }
}

// Helper functions for data cleaning
const cleanPhoneNumber = (phone: any): string | undefined => {
  if (!phone) return undefined
  // Convert to string and clean
  const phoneStr = String(phone).replace(/[^\d+]/g, '')
  return phoneStr || undefined
}

const cleanDateValue = (dateValue: any): string | undefined => {
  if (!dateValue) return undefined
  
  // If it's a number (Excel serial date), convert it
  if (typeof dateValue === 'number') {
    try {
      // Excel serial date to JavaScript date
      const date = new Date((dateValue - 25569) * 86400 * 1000)
      return date.toISOString().split('T')[0] // YYYY-MM-DD format
    } catch {
      return undefined
    }
  }
  
  // If it's already a string, return as is
  return String(dateValue).trim() || undefined
}

const cleanStringValue = (value: any): string | undefined => {
  if (!value) return undefined
  return String(value).trim() || undefined
}

const cleanNumberValue = (value: any): number | undefined => {
  if (!value) return undefined
  const num = typeof value === 'number' ? value : parseFloat(String(value))
  return isNaN(num) ? undefined : num
}

// Process Excel row to CV object
const processExcelRow = (row: ExcelRow, rowNumber: number): ProcessedCV => {
  try {
    return {
      rowNumber,
      fullName: cleanStringValue(row['الاسم الكامل']) || '',
      fullNameArabic: cleanStringValue(row['الاسم بالعربية']),
      email: cleanStringValue(row['البريد الإلكتروني']),
      phone: cleanPhoneNumber(row['رقم الهاتف']),
      referenceCode: cleanStringValue(row['رمز المرجع']),
      monthlySalary: cleanStringValue(row['الراتب الشهري']),
      contractPeriod: cleanStringValue(row['فترة العقد']),
      position: cleanStringValue(row['المنصب']),
      passportNumber: cleanStringValue(row['رقم جواز السفر']),
      passportIssueDate: cleanDateValue(row['تاريخ إصدار الجواز']),
      passportExpiryDate: cleanDateValue(row['تاريخ انتهاء الجواز']),
      passportIssuePlace: cleanStringValue(row['مكان إصدار الجواز']),
      nationality: cleanStringValue(row['الجنسية']),
      religion: cleanStringValue(row['الديانة']),
      dateOfBirth: cleanDateValue(row['تاريخ الميلاد']),
      placeOfBirth: cleanStringValue(row['مكان الميلاد']),
      livingTown: cleanStringValue(row['مكان السكن']),
      maritalStatus: normalizeMaritalStatus(row['الحالة الاجتماعية']),
      numberOfChildren: cleanNumberValue(row['عدد الأطفال']),
      weight: cleanStringValue(row['الوزن']),
      height: cleanStringValue(row['الطول']),
      complexion: cleanStringValue(row['لون البشرة']),
      age: cleanNumberValue(row['العمر']),
      englishLevel: normalizeSkillLevel(row['مستوى الإنجليزية']),
      arabicLevel: normalizeSkillLevel(row['مستوى العربية']),
      babySitting: normalizeSkillLevel(row['رعاية الأطفال']),
      childrenCare: normalizeSkillLevel(row['رعاية الأطفال المتقدمة']),
      tutoring: normalizeSkillLevel(row['التدريس']),
      disabledCare: normalizeSkillLevel(row['رعاية ذوي الاحتياجات الخاصة']),
      cleaning: normalizeSkillLevel(row['التنظيف']),
      washing: normalizeSkillLevel(row['الغسيل']),
      ironing: normalizeSkillLevel(row['الكي']),
      arabicCooking: normalizeSkillLevel(row['الطبخ العربي']),
      sewing: normalizeSkillLevel(row['الخياطة']),
      driving: normalizeSkillLevel(row['القيادة']),
      experience: row['الخبرة'],
      education: row['التعليم'],
      skills: row['المهارات'],
      summary: row['الملخص'],
      priority: normalizePriority(row['الأولوية']),
      notes: row['ملاحظات'],
      isUpdate: false
    }
  } catch (error) {
    console.error('Error processing row:', error)
    throw error
  }
}

// Safe database operation wrapper
const safeDBOperation = async (operation: () => Promise<any>, errorMessage: string) => {
  try {
    return await operation()
  } catch (error) {
    console.error(errorMessage, error)
    throw new Error(`${errorMessage}: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    // Authentication
    const userIdString = request.headers.get('x-user-id')
    const userRole = request.headers.get('x-user-role')

    if (!userIdString) {
      return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
    }

    const userId = parseInt(userIdString, 10)
    if (isNaN(userId)) {
      return NextResponse.json({ error: 'معرف المستخدم غير صحيح' }, { status: 400 })
    }

    // Check permissions
    if (userRole !== 'ADMIN' && userRole !== 'SUB_ADMIN') {
      return NextResponse.json(
        { error: 'صلاحيات غير كافية' },
        { status: 403 }
      )
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    const action = formData.get('action') as string || 'analyze'

    if (!file) {
      return NextResponse.json(
        { error: 'لم يتم تحديد ملف' },
        { status: 400 }
      )
    }

    // Validate file type
    const allowedTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv'
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'نوع الملف غير صحيح. يرجى رفع ملف Excel (.xlsx, .xls) أو CSV' },
        { status: 400 }
      )
    }

    // Read and parse Excel file
    let jsonData: ExcelRow[]
    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'buffer' })
      const sheetName = workbook.SheetNames[0]
      const worksheet = workbook.Sheets[sheetName]
      jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelRow[]
    } catch (error) {
      return NextResponse.json(
        { error: 'فشل في قراءة ملف Excel. تأكد من أن الملف غير تالف' },
        { status: 400 }
      )
    }

    if (jsonData.length === 0) {
      return NextResponse.json(
        { error: 'ملف Excel فارغ أو لا يحتوي على بيانات صحيحة' },
        { status: 400 }
      )
    }

    // Process each row
    const results: ImportResult = {
      totalRows: jsonData.length,
      newRecords: 0,
      updatedRecords: 0,
      skippedRecords: 0,
      errorRecords: 0,
      details: {
        newCVs: [],
        updatedCVs: [],
        skippedCVs: [],
        errorCVs: []
      },
      summary: ''
    }

    // Analyze each row for duplicates
    for (let i = 0; i < jsonData.length; i++) {
      try {
        const cv = processExcelRow(jsonData[i], i + 2) // +2 because Excel starts from row 1 and has header

        // Skip empty rows
        if (!cv.fullName || !cv.fullName.trim()) {
          cv.duplicateReason = 'الصف فارغ - لا يحتوي على اسم'
          results.details.skippedCVs.push(cv)
          results.skippedRecords++
          continue
        }

        // Check for duplicates
        const duplicateCheck = await checkForDuplicates(cv)
        
        if (duplicateCheck.isDuplicate) {
          cv.isUpdate = true
          cv.existingId = duplicateCheck.existingId
          cv.duplicateReason = duplicateCheck.reason
          results.details.updatedCVs.push(cv)
          results.updatedRecords++
        } else {
          results.details.newCVs.push(cv)
          results.newRecords++
        }
      } catch (error) {
        const errorCV: ProcessedCV = {
          rowNumber: i + 2,
          fullName: jsonData[i]['الاسم الكامل'] || `الصف ${i + 2}`,
          isUpdate: false,
          duplicateReason: `خطأ في معالجة البيانات: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
        }
        results.details.errorCVs.push(errorCV)
        results.errorRecords++
      }
    }

    // If action is 'execute', perform the actual import/update
    if (action === 'execute') {
      const errors: string[] = []

      // Insert new records
      for (const cv of results.details.newCVs) {
        try {
          await prisma.cV.create({
              data: {
                fullName: cv.fullName,
                fullNameArabic: cv.fullNameArabic || null,
                email: cv.email || null,
                phone: cv.phone || null,
                referenceCode: cv.referenceCode || null,
                monthlySalary: cv.monthlySalary || null,
                contractPeriod: cv.contractPeriod || null,
                position: cv.position || null,
                passportNumber: cv.passportNumber || '',
                passportIssueDate: cv.passportIssueDate || null,
                passportExpiryDate: cv.passportExpiryDate || null,
                passportIssuePlace: cv.passportIssuePlace || null,
                nationality: cv.nationality || null,
                religion: cv.religion || null,
                dateOfBirth: cv.dateOfBirth || null,
                placeOfBirth: cv.placeOfBirth || null,
                livingTown: cv.livingTown || null,
                maritalStatus: cv.maritalStatus || null,
                numberOfChildren: cv.numberOfChildren || null,
                weight: cv.weight || null,
                height: cv.height || null,
                complexion: cv.complexion || null,
                age: cv.age || null,
                englishLevel: cv.englishLevel || null,
                arabicLevel: cv.arabicLevel || null,
                educationLevel: cv.educationLevel || null,
                babySitting: cv.babySitting || null,
                childrenCare: cv.childrenCare || null,
                tutoring: cv.tutoring || null,
                disabledCare: cv.disabledCare || null,
                cleaning: cv.cleaning || null,
                washing: cv.washing || null,
                ironing: cv.ironing || null,
                arabicCooking: cv.arabicCooking || null,
                sewing: cv.sewing || null,
                driving: cv.driving || null,
                elderCare: cv.elderCare || null,
                housekeeping: cv.housekeeping || null,
                cooking: cv.cooking || null,
                experience: cv.experience || null,
                education: cv.education || null,
                skills: cv.skills || null,
                summary: cv.summary || null,
                notes: cv.notes || null,
                priority: cv.priority || 'MEDIUM',
                source: 'Excel Smart Import',
                createdById: userId,
                updatedById: userId
              }
            })
        } catch (error) {
          console.error(`فشل في إنشاء السيرة الذاتية للصف ${cv.rowNumber}:`, error)
          
          // نقل السيرة من newCVs إلى errorCVs
          const errorCV: ProcessedCV = {
            ...cv,
            duplicateReason: `خطأ في الحفظ: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
          }
          results.details.errorCVs.push(errorCV)
          results.errorRecords++
          results.newRecords--
          
          errors.push(`الصف ${cv.rowNumber} (${cv.fullName}): ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
        }
      }

      // Update existing records
      for (const cv of results.details.updatedCVs) {
        if (cv.existingId) {
          try {
            await prisma.cV.update({
                where: { id: cv.existingId },
                data: {
                  fullName: cv.fullName,
                  fullNameArabic: cv.fullNameArabic || null,
                  email: cv.email || null,
                  phone: cv.phone || null,
                  referenceCode: cv.referenceCode || null,
                  monthlySalary: cv.monthlySalary || null,
                  contractPeriod: cv.contractPeriod || null,
                  position: cv.position || null,
                  passportNumber: cv.passportNumber || '',
                  passportIssueDate: cv.passportIssueDate || null,
                  passportExpiryDate: cv.passportExpiryDate || null,
                  passportIssuePlace: cv.passportIssuePlace || null,
                  nationality: cv.nationality || null,
                  religion: cv.religion || null,
                  dateOfBirth: cv.dateOfBirth || null,
                  placeOfBirth: cv.placeOfBirth || null,
                  livingTown: cv.livingTown || null,
                  maritalStatus: cv.maritalStatus || null,
                  numberOfChildren: cv.numberOfChildren || null,
                  weight: cv.weight || null,
                  height: cv.height || null,
                  complexion: cv.complexion || null,
                  age: cv.age || null,
                  englishLevel: cv.englishLevel || null,
                  arabicLevel: cv.arabicLevel || null,
                  educationLevel: cv.educationLevel || null,
                  babySitting: cv.babySitting || null,
                  childrenCare: cv.childrenCare || null,
                  tutoring: cv.tutoring || null,
                  disabledCare: cv.disabledCare || null,
                  cleaning: cv.cleaning || null,
                  washing: cv.washing || null,
                  ironing: cv.ironing || null,
                  arabicCooking: cv.arabicCooking || null,
                  sewing: cv.sewing || null,
                  driving: cv.driving || null,
                  elderCare: cv.elderCare || null,
                  housekeeping: cv.housekeeping || null,
                  cooking: cv.cooking || null,
                  experience: cv.experience || null,
                  education: cv.education || null,
                  skills: cv.skills || null,
                  summary: cv.summary || null,
                  notes: cv.notes || null,
                  priority: cv.priority || 'MEDIUM',
                  updatedById: userId
                }
              })
          } catch (error) {
            console.error(`فشل في تحديث السيرة الذاتية للصف ${cv.rowNumber}:`, error)
            
            // نقل السيرة من updatedCVs إلى errorCVs
            const errorCV: ProcessedCV = {
              ...cv,
              duplicateReason: `خطأ في التحديث: ${error instanceof Error ? error.message : 'خطأ غير معروف'}`
            }
            results.details.errorCVs.push(errorCV)
            results.errorRecords++
            results.updatedRecords--
            
            errors.push(`الصف ${cv.rowNumber} (${cv.fullName}): ${error instanceof Error ? error.message : 'خطأ غير معروف'}`)
          }
        }
      }

      // Send notification about the import
      try {
        const user = await prisma.user.findUnique({ where: { id: userId } })
        if (user) {
          await NotificationService.notifyImport({
            fileName: file.name,
            totalRows: results.totalRows,
            newRecords: results.newRecords,
            updatedRecords: results.updatedRecords,
            skippedRecords: results.skippedRecords,
            errorRecords: results.errorRecords + errors.length,
            importType: 'الاستيراد الذكي',
            userId: userId,
            userName: user.name
          })
        }
      } catch (notificationError) {
        console.error('Error sending import notification:', notificationError)
      }

      // If there were errors during execution, include them in the response
      if (errors.length > 0) {
        results.summary += ` - أخطاء في التنفيذ: ${errors.length}`
        return NextResponse.json({
          ...results,
          executionErrors: errors,
          warning: 'تم تنفيذ بعض العمليات بنجاح مع وجود أخطاء'
        })
      }
    }

    // Generate summary
    results.summary = `تم تحليل ${results.totalRows} صف: ${results.newRecords} جديد، ${results.updatedRecords} تحديث، ${results.skippedRecords} تم تخطيه، ${results.errorRecords} خطأ`

    return NextResponse.json(results)

  } catch (error) {
    console.error('خطأ في استيراد البيانات الذكي:', error)
    return NextResponse.json(
      { 
        error: 'حدث خطأ أثناء معالجة الملف',
        details: error instanceof Error ? error.message : 'خطأ غير معروف',
        suggestion: 'تأكد من أن الملف يحتوي على البيانات الصحيحة والأعمدة المطلوبة'
      },
      { status: 500 }
    )
  } finally {
    // Clean up Prisma connection
    await prisma.$disconnect()
  }
}