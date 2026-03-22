import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'

const PRIMARY_COLOR = '#409EFF'

function formatDate(dateStr) {
  if (!dateStr) return '-'
  // 将 YYYYMMDD 格式转换为 YYYY年MM月DD日
  if (/^\d{8}$/.test(String(dateStr))) {
    const year = dateStr.slice(0, 4)
    const month = dateStr.slice(4, 6)
    const day = dateStr.slice(6, 8)
    return `${year}年${parseInt(month)}月${parseInt(day)}日`
  }
  return dateStr
}

function formatMoney(value) {
  if (value === undefined || value === null) return '-'
  return '¥' + Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

function formatPercent(value) {
  if (value === undefined || value === null) return '-'
  return (value * 100).toFixed(1) + '%'
}

function generateHumanInsight(templateId, statistics) {
  const insights = []

  switch (templateId) {
    case 'top10':
      if (statistics.top1Contribution > 0.3) {
        insights.push(`头部效应显著：第一名${statistics.top1Name}贡献${formatPercent(statistics.top1Contribution)}，建议重点维护该客户/产品关系。`)
      }
      if (statistics.top3Contribution > 0.5) {
        insights.push(`TOP3集中度${formatPercent(statistics.top3Contribution)}，业务依赖度过高，存在风险。`)
      }
      if (statistics.totalSales > 0) {
        insights.push(`统计周期内总销售额${formatMoney(statistics.totalSales)}，平均客单价${formatMoney(statistics.avgSales)}。`)
      }
      break

    case 'product':
      if (statistics.top1Contribution > 0.2) {
        insights.push(`明星产品${statistics.starProduct}表现突出，贡献${formatPercent(statistics.top1Contribution)}销售额。`)
      }
      if (statistics.pareto?.top3Contribution > 0.6) {
        insights.push('符合二八定律：TOP3产品贡献超60%营收，建议聚焦核心产品线。')
      }
      if (statistics.pareto?.longTailCount > 10) {
        insights.push(`发现${statistics.pareto.longTailCount}个长尾产品（占比<5%），可考虑淘汰或整合。`)
      }
      break

    case 'comparison':
      if (statistics.maxGap > 3) {
        insights.push(`团队业绩差距较大（${statistics.maxGap.toFixed(1)}倍），建议分析头部员工方法论并复制推广。`)
      }
      if (statistics.aboveAvgCount / statistics.totalEmployees < 0.3) {
        insights.push(`仅${formatPercent(statistics.aboveAvgCount / statistics.totalEmployees)}员工达标，需加强培训或调整目标。`)
      } else {
        insights.push(`${formatPercent(statistics.aboveAvgCount / statistics.totalEmployees)}员工超额完成，团队整体表现良好。`)
      }
      break

    case 'region':
      if (statistics.concentration === 'high') {
        insights.push(`区域集中度${formatPercent(statistics.topContribution)}，核心市场优势明显但需防范区域风险。`)
      } else {
        insights.push('区域分布较为均衡，抗风险能力较强。')
      }
      if (statistics.topRegion && statistics.bottomRegion) {
        insights.push(`${statistics.topRegion}领先，${statistics.bottomRegion}有待提升，建议差异化策略。`)
      }
      break
  }

  return insights
}

function buildTableData(templateId, resultData) {
  const data = resultData.top10 || resultData.allEmployees || resultData.regions || resultData.topProducts || []

  switch (templateId) {
    case 'top10':
      return {
        headers: ['排名', '名称', '销售额', '占比', '累计占比'],
        rows: data.map(item => [
          item.rank,
          item.name,
          formatMoney(item.value),
          formatPercent(item.contribution),
          formatPercent(item.cumulativeContribution)
        ])
      }

    case 'product':
      return {
        headers: ['排名', '产品名称', '销售额', '占比', '累计占比'],
        rows: data.map(item => [
          item.rank,
          item.name,
          formatMoney(item.value),
          formatPercent(item.contribution),
          formatPercent(item.cumulativeContribution)
        ])
      }

    case 'comparison':
      return {
        headers: ['排名', '员工', '销售额', 'vs平均', '状态'],
        rows: data.map(item => [
          item.rank,
          item.name,
          formatMoney(item.value),
          (item.vsAvg > 0 ? '+' : '') + formatPercent(item.vsAvg),
          item.isAboveAvg ? '达标' : '未达标'
        ])
      }

    case 'region':
      return {
        headers: ['排名', '区域', '销售额', '占比'],
        rows: data.map(item => [
          item.rank,
          item.name,
          formatMoney(item.value),
          formatPercent(item.contribution)
        ])
      }

    default:
      return { headers: [], rows: [] }
  }
}

export async function generatePDF(templateId, resultData, dateRange, chartImageBase64) {
  const period = dateRange?.start && dateRange?.end
    ? `${formatDate(dateRange.start)} 至 ${formatDate(dateRange.end)}`
    : '全部时间'

  const insights = generateHumanInsight(templateId, resultData.statistics || {})
  const tableData = buildTableData(templateId, resultData)

  // 创建临时容器用于渲染 PDF 内容
  const container = document.createElement('div')
  container.style.cssText = `
    position: fixed;
    left: -9999px;
    top: 0;
    width: 794px;
    padding: 40px;
    background: white;
    font-family: 'Microsoft YaHei', 'SimHei', sans-serif;
    color: #333;
    line-height: 1.6;
  `

  // 构建 PDF HTML 内容
  const titleMap = {
    top10: '员工业绩排行榜',
    product: '产品盈利分析',
    comparison: '团队业绩对比',
    region: '地区销售分布'
  }

  container.innerHTML = `
    <div style="text-align: center; margin-bottom: 40px;">
      <h1 style="font-size: 28px; color: ${PRIMARY_COLOR}; margin: 0 0 20px 0; font-weight: bold;">
        DATAMIND 智能决策报告
      </h1>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        报告类型：${titleMap[templateId] || '数据分析报告'}
      </p>
      <p style="font-size: 14px; color: #666; margin: 5px 0;">
        数据时间范围：${period}
      </p>
      <p style="font-size: 12px; color: #999; margin: 5px 0;">
        生成时间：${new Date().toLocaleString('zh-CN')}
      </p>
    </div>

    <div style="margin-bottom: 30px;">
      <h2 style="font-size: 18px; color: ${PRIMARY_COLOR}; border-bottom: 2px solid ${PRIMARY_COLOR}; padding-bottom: 10px; margin: 0 0 15px 0;">
        核心洞察
      </h2>
      ${insights.map(insight => `
        <p style="font-size: 12px; color: #333; margin: 8px 0; line-height: 1.8;">
          • ${insight}
        </p>
      `).join('')}
    </div>

    ${chartImageBase64 ? `
      <div style="margin-bottom: 30px; page-break-before: always;">
        <h2 style="font-size: 18px; color: ${PRIMARY_COLOR}; border-bottom: 2px solid ${PRIMARY_COLOR}; padding-bottom: 10px; margin: 0 0 20px 0;">
          数据可视化
        </h2>
        <div style="text-align: center;">
          <img src="${chartImageBase64}" style="max-width: 100%; height: auto;" />
        </div>
      </div>
    ` : ''}

    <div style="margin-bottom: 30px; ${chartImageBase64 ? 'page-break-before: always;' : ''}">
      <h2 style="font-size: 18px; color: ${PRIMARY_COLOR}; border-bottom: 2px solid ${PRIMARY_COLOR}; padding-bottom: 10px; margin: 0 0 20px 0;">
        数据明细 (${tableData.rows.length > 50 ? '前50条 / 共' + tableData.rows.length + '条' : '共' + tableData.rows.length + '条'})
      </h2>
      <table style="width: 100%; border-collapse: collapse; font-size: 10px;">
        <thead>
          <tr style="background-color: ${PRIMARY_COLOR}; color: white;">
            ${tableData.headers.map(h => `
              <th style="padding: 10px 8px; text-align: center; border: 1px solid #ddd; font-weight: bold;">
                ${h}
              </th>
            `).join('')}
          </tr>
        </thead>
        <tbody>
          ${tableData.rows.slice(0, 50).map((row, index) => `
            <tr style="background-color: ${index % 2 === 0 ? '#f5f5f5' : 'white'};">
              ${row.map(cell => `
                <td style="padding: 8px; text-align: center; border: 1px solid #ddd; color: #333;">
                  ${cell}
                </td>
              `).join('')}
            </tr>
          `).join('')}
        </tbody>
      </table>
      ${tableData.rows.length > 50 ? `
        <p style="font-size: 11px; color: #999; text-align: center; margin-top: 15px;">
          * 仅展示前50条，完整数据请使用"下载完整数据"功能
        </p>
      ` : ''}
    </div>

    <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
      <p style="font-size: 10px; color: #999; margin: 0;">
        本报告由 DATAMIND 智能分析系统生成
      </p>
      <p style="font-size: 10px; color: #999; margin: 5px 0 0 0;">
        © ${new Date().getFullYear()} DATAMIND. All rights reserved.
      </p>
    </div>
  `

  document.body.appendChild(container)

  try {
    // 使用 html2canvas 将 HTML 转换为 canvas
    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#ffffff',
      logging: false
    })

    // 计算 PDF 尺寸（A4）
    const imgWidth = 210 // A4 宽度 mm
    const pageHeight = 297 // A4 高度 mm
    const imgHeight = (canvas.height * imgWidth) / canvas.width

    // 创建 PDF
    const pdf = new jsPDF('p', 'mm', 'a4')

    // 如果内容超过一页，需要分页
    let heightLeft = imgHeight
    let position = 0

    // 将 canvas 转换为图片数据
    const imgData = canvas.toDataURL('image/png')

    // 添加第一页
    pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
    heightLeft -= pageHeight

    // 如果内容超过一页，添加更多页
    while (heightLeft > 0) {
      position = heightLeft - imgHeight
      pdf.addPage()
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight
    }

    // 生成 PDF 文件名
    const filename = `DATAMIND_${templateId}_${Date.now()}.pdf`

    // 获取 PDF 数据为 Uint8Array
    const pdfOutput = pdf.output('arraybuffer')
    const uint8Array = new Uint8Array(pdfOutput)

    // 通过 IPC 发送到主进程保存
    if (window.electronAPI?.saveFile) {
      const result = await window.electronAPI.saveFile({
        buffer: uint8Array,
        filename,
        filters: [{ name: 'PDF 文件', extensions: ['pdf'] }]
      })
      if (result.success) {
        return filename
      } else {
        throw new Error(result.reason || '保存失败')
      }
    } else {
      // 降级处理：浏览器环境直接下载
      pdf.save(filename)
      return filename
    }
  } finally {
    // 清理临时容器
    document.body.removeChild(container)
  }
}
