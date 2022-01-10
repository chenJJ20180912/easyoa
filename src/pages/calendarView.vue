<template>
  <div class="calendar-container" v-if="readyRender">

    <div class="config-container">
      <span class="picker-item">上班时间:<a-time-picker v-model="_normalStartTime" format="HH:mm"/></span>
      <span class="picker-item">下班时间:<a-time-picker v-model="_normalEndTime" format="HH:mm"/></span>
      <span class="picker-item"><a-button shape="circle" icon="download" @click="doExportAttendanceExcel"/></span>
    </div>

    <h2>{{ _monthStr }}</h2>
    <div class="toolbar">
        <span class="left-btn-group">
          <a-button-group :size="size">
              <a-button @click="monthChange(-1)">
                <a-icon type="left"/>上月
              </a-button>
              <a-button @click="monthChange(0)">
                本月
              </a-button>
              <a-button @click="monthChange(1)">
                下月<a-icon type="right"/>
              </a-button>
          </a-button-group>
        </span>
    </div>
    <div class="calendar-body">
      <span class="title calendar-item" v-for="(headerItem,headerIdx) in headers" :key="'title-'+headerIdx">
        <span>{{ headerItem }}</span>
      </span>
      <span :class="['calendar-item',getCssClass(item)]" v-for="(item,idx) in _showDates" :key="'item-'+idx">
        <template v-if="item">
           <span class="item-title">{{ item.getDate() }}</span>
           <template v-for="(cssItem,cssIdx) in getCssClass(item).split(' ')">
              <template v-if="dayStatusMap[cssItem]">
               <span class="item-content" :key="cssIdx">
                  <span :class="[cssItem,'item']"> {{ dayStatusMap[cssItem] }}</span>
               </span>
             </template>
           </template>
        </template>
      </span>
    </div>
  </div>
</template>

<script>
import {isHoliday, isWorkday} from "@/config/holidays";
import {getAttendanceRecord, getLeaveRecord, getWorkTimeAttendanceRecord} from "@/http/api";
import {getCurUser} from "@/cache";
import moment from "moment";
import XLSX from 'xlsx'

export default {
  name: "calendarView",
  props: {},
  computed: {
    _startDate() {
      return this.$anEasyToolkit.dateUtils.dateToString(this.month, "yyyy-MM") + "-21"
    },
    _endDate() {
      return this.$anEasyToolkit.dateUtils.dateToString(this.$anEasyToolkit.dateUtils.addMonth(this.month, 1), "yyyy-MM") + "-20"
    },
    _dates() {
      return this.$anEasyToolkit.dateUtils.getDatesInRange(this._startDate, this._endDate)
    },
    _leaveDataMap() {
      const leaveData = []
      this.leaveData.forEach(item => {
        const startDate = item['formmain_0234_0_field0015']
        const endDate = item['formmain_0234_0_field0016']
        // 获取之间的所有日期
        this.$anEasyToolkit.dateUtils.getDatesInRange(startDate, endDate, false).forEach(day => {
          // 默认所有的请假都是全天的
          leaveData.push({
            day: day,
            status: '01'
          })
          leaveData.push({
            day: day,
            status: '02'
          })
        })
      })
      return this.$anEasyToolkit.arrayUtils.groupBy(leaveData, 'day', 'status')
    },
    _attendanceDataMap() {
      const attendanceData = []
      this.attendanceData.forEach(item => {
        const dateTime = item.datas['field0007']
        const ss = dateTime.split(" ")
        const time = parseInt(ss[1].replace(":", ""))
        const day = {
          day: ss[0],
          status: '00'
        }
        if (time <= this.normalAttendanceTime[0]) {
          day.status = '01'
        } else if (time >= this.normalAttendanceTime[1]) {
          day.status = '02'
        }
        if (day.status !== '00') {
          attendanceData.push(day)
        }
      })
      return this.$anEasyToolkit.arrayUtils.groupBy(attendanceData, 'day', 'status')
    },
    _showDates() {
      let showDates = [].concat(this._dates)
      // 判断第一天是周几
      let firstDay = showDates[0].getDay(), lastDay = showDates[showDates.length - 1].getDay()
      const arr = []
      if (firstDay === 0) {
        firstDay = 7;
      }
      firstDay--;
      for (let i = 0; i < firstDay; i++) {
        // 塞一个空格子
        arr.push(undefined)
      }
      if (lastDay === 0) {
        lastDay = 7;
      }
      for (let i = lastDay; i < 7; i++) {
        // 塞一个空格子
        showDates.push(undefined)
      }
      return arr.concat(showDates)
    },
    // 汇总后的数据
    _summaryData() {
      // 先将日期格式的数据转换成为文本类型
      const dates = this._dates.map(item => this.$anEasyToolkit.dateUtils.dateToString(item, this.$anEasyToolkit.dateUtils.date_formatter_short));
      const summaryData = []
      // 开始构建数据
      dates.forEach(item => {
        const dayStatus = {
          day: item,
          status: '', // 考勤状态
          workTimeStatus: ''// 工时状态
        }
        if (item.localeCompare(this._curDateStr) > 0) {
          dayStatus.status = 'normal'
          summaryData.push(dayStatus)
          return
        }
        // 先获取当天是否为节假日
        if (isHoliday(item)) {
          dayStatus.status = 'holiday'
        } else {
          // 如果当天是双休 并且不是工作日
          const day = this.$anEasyToolkit.dateUtils.stringToDate(item, this.$anEasyToolkit.dateUtils.date_formatter_short).getDay()
          const isRest = [0, 6].includes(day)
          if (isRest && !isWorkday(item)) {
            // 双休
            dayStatus.status = 'rest'
          } else {
            //  查找当天的请假信息
            const leaveData = this._leaveDataMap[item] || []
            if (leaveData.length === 2) {
              // 请假了全天
              dayStatus.status = 'normal  leave full'
            } else {
              //  查找当天的考勤信息
              const attendanceData = this._attendanceDataMap[item] || []
              let data = leaveData.concat(attendanceData)
              data = this.$anEasyToolkit.arrayUtils.distinctArray(data)
              if (data.length === 2) {
                dayStatus.status = 'normal'
              } else if (data.length === 0) {
                // 一天都没打
                dayStatus.status = 'none'
              } else {
                // 打了一天
                if (data.includes('01')) {
                  // 没下班卡
                  dayStatus.status = 'none-down'
                } else {
                  // 没上班卡
                  dayStatus.status = 'none-up'
                }
              }
              if (leaveData.length === 1) {
                dayStatus.status += "leave";
              }
              if (this.workTimeAttendanceData.includes(item)) {
                dayStatus.workTimeStatus = 'wt-normal'
              } else {
                dayStatus.workTimeStatus = 'wt-none'
              }
            }

            if (isRest && isWorkday(item) && dayStatus.status.indexOf('leave') === -1) {
              // 补班
              dayStatus.status += " work ";
            }
          }
        }
        summaryData.push(dayStatus)
      })
      return summaryData
    },
    _summaryDataMap() {
      return this.$anEasyToolkit.arrayUtils.toMap(this._summaryData, 'day')
    },
    _normalStartTime: {
      get() {
        let time = this.normalAttendanceTime[0] + ""
        if (time.length === 3) {
          time = "0" + time
        }
        return moment(time, "HHmm")
      },
      set(newVal) {
        const time = parseInt(this.$anEasyToolkit.dateUtils.dateToString(newVal.toDate(), "HHmm"))
        this.$set(this.normalAttendanceTime, 0, time)
      }
    },
    _normalEndTime: {
      get() {
        let time = this.normalAttendanceTime[1] + ""
        if (time.length === 3) {
          time = "0" + time
        }
        return moment(time, "HHmm")
      },
      set(newVal) {
        const time = parseInt(this.$anEasyToolkit.dateUtils.dateToString(newVal.toDate(), "HHmm"))
        this.$set(this.normalAttendanceTime, 1, time)
      }
    },
    _monthStr() {
      return this.$anEasyToolkit.dateUtils.dateToString(this.month, "yyyy年MM月");
    },
    _curMonth() {
      const now = new Date()
      let month = now;
      if (now.getDate() < 20) {
        month = this.$anEasyToolkit.dateUtils.addMonth(now, -1)
      }
      return month
    },
    _curDateStr() {
      return this.$anEasyToolkit.dateUtils.dateToString(new Date(), this.$anEasyToolkit.dateUtils.date_formatter_short)
    }
  },
  data() {
    const now = new Date()
    let month = now;
    if (now.getDate() < 20) {
      month = this.$anEasyToolkit.dateUtils.addMonth(now, -1)
    }
    return {
      toDateStr: this.$anEasyToolkit.dateUtils.dateToString(new Date(), this.$anEasyToolkit.dateUtils.date_formatter_short),
      size: 'small',
      normalAttendanceTime: [930, 1700],// 设置正常的上下班打卡时间
      month: month,
      readyRender: false,// 是否准备好了数据,可以开始渲染了
      headers: ['一', '二', '三', '四', '五', '六', '日'],
      attendanceData: [],// 考勤数据
      leaveData: [],// 请假数据
      workTimeAttendanceData: [],// 工时卡数据
      dayStatus: [
        {value: 'normal', label: '正常打卡'},
        {value: 'rest', label: '双休'},
        {value: 'holiday', label: '法定节假日'},
        {value: 'none', label: '异常'},
      ],
      dayStatusMap: {
        'none': '全天缺卡',
        'none-up': '上班缺卡',
        'none-down': '下班缺卡',
        'wt-none': '工时缺卡',
      }
    }
  },
  mounted() {
    this.loadData()
  },
  methods: {
    loadData() {
      const plst = []
      // 加载考勤数据
      plst.push(getAttendanceRecord(this._startDate, this._endDate).then(resp => {
        this.attendanceData = resp.data.data["5C525E3D-3398-4EDD-8905-82CDB9DA8608"].dataFields || []
      }))
      // 加载请假单 请假单需要向前向后偏移几天 再取，因为请假单一般是提前或者推后填写
      const offset = 15;
      const startDate = this.$anEasyToolkit.dateUtils.addDay(this._startDate, -offset)
      const endDate = this.$anEasyToolkit.dateUtils.addDay(this._endDate, -offset)
      plst.push(getLeaveRecord(startDate, endDate).then(resp => {
        const userCode = getCurUser().code
        this.leaveData = (resp.data.data['BC8CA80D-9921-4505-83F6-05C1120B0450'].queryData.data || []).filter(item => item['formmain_0234_0_field0018'] === userCode)
      }))
      // 加载工时打卡数据
      plst.push(getWorkTimeAttendanceRecord(this._startDate, this._endDate).then(resp => {
        this.workTimeAttendanceData = (resp.data || []).map(item => item['receiveTime'].substring(0, 10))
      }))
      // 所有数据都获取到了之后再开始界面的渲染
      Promise.all(plst).then(() => {
        this.readyRender = true
      })
    },
    getCssClass(item) {
      if (!item) {
        return "empty"
      }
      const dateStr = this.$anEasyToolkit.dateUtils.dateToString(item, this.$anEasyToolkit.dateUtils.date_formatter_short)
      // 获取当天的状态
      const dayStatus = this._summaryDataMap[dateStr]
      return dayStatus.status + " " + dayStatus.workTimeStatus + (dateStr === this.toDateStr ? " today " : '')
    },
    monthChange(val) {
      if (val === 0) {
        this.month = this._curMonth
      } else {
        this.month = this.$anEasyToolkit.dateUtils.addMonth(this.month, val)
      }
      this.loadData()
    },
    doExportAttendanceExcel() {
      const body = [['补考勤时间', '原因']]
      const desc = '忘打卡'
      this._summaryData.filter(item => ['none', 'none-up', 'none-down'].includes(item.status)).map(item => {
        if (item.status === 'none-up') {
          body.push([item.day + " 08:30:00", desc])
        } else if (item.status === 'none-down') {
          body.push([item.day + " 18:00:00", desc])
        } else {
          body.push([item.day + " 08:30:00", desc])
          body.push([item.day + " 18:00:00", desc])
        }
      })
      this.exportFromArray({
        title: ['补考勤明细表'],
        body: body,
        name: '补考勤',
        suffix: 'xlsx',
        merges: [{s: {r: 0, c: 0}, e: {r: 0, c: 1}}],// 首行合并
      })
    },
    /**
     * @description                  依据数据导出表格，一般是根据查询出的数据导出表格
     * @param {Object} option        Object--配置对象
     * @param option.title      Array--表头，即表格首行展示的内容，如：['姓名','年龄','性别','地址']
     * @param option.body       Array--表格内容，二维数组，每一行的内容为一个数组，与表头对应，如:[['王小虎',28,'男','aa'],['王大虎',29,'男','aa']]
     * @param option.name       String--文件名，如:'demo'
     * @param option.suffix     String--文件后缀名，如'csv'
     * @param option.merges     Array--表格的单元格合并信息，如[
     { s: { r: 0, c: 0 }, e: { r: 1, c: 0 } },-----表示A1和A2单元格合并
     { s: { r: 0, c: 1 }, e: { r: 0, c: 2 } },-----表示B1和C1单元格合并
     { s: { r: 0, c: 3 }, e: { r: 0, c: 4 } },-----表示D1和E1单元格合并
     { s: { r: 0, c: 5 }, e: { r: 1, c: 5 } }-----表示F1和F2单元格合并
     ]------s:start,e:end,r:row,c:cell;
     */
    exportFromArray(option) {
      const config = Object.assign({}, {name: 'demo', suffix: 'csv'}, option)
      const {title, body, name, suffix, merges} = config;
      const array = [title, ...body];
      const workBook = XLSX.utils.book_new();//创建workBook
      const workSheet = XLSX.utils.aoa_to_sheet(array);//将数组转换成workSheet
      const fileName = name + '.' + suffix;
      workSheet['!merges'] = merges;
      XLSX.utils.book_append_sheet(workBook, workSheet, name);
      XLSX.writeFile(workBook, fileName, {bookType: suffix, type: 'buffer'})
    }
  }
}
</script>

<style scoped lang="scss">
$holiday: #8fd791;
$rest: #91aaf1;
$normal: #84f0ee;
$none: #DD223B;
$none-up: #DD223B;
$none-down: #DD223B;
$wt-none: #DD223B;
$leave: #1c3db5;
$work: #f82862;

.calendar-container {
  user-select: none;
  width: 480px;
  height: 560px;
  padding: 10px;

  .config-container {
    height: 80px;
  }

  span {
    display: inline-block;
  }

  .toolbar {
    position: relative;
    height: 40px;

    .left-btn-group {
      position: absolute;
      right: 10px;

    }

  }


  .calendar-body {
    display: flex;
    flex-wrap: wrap;
    width: 480px;
    height: 480px;

    .title {
      font-size: 18px;
      font-weight: 800;
    }

    .calendar-item:not(.title) {
      height: 13.5%;
    }

    .calendar-item {
      width: 13.5%;
      position: relative;

      .item-title {
        font-size: 18px;
        text-align: center;
        color: black;
        top: 3px;
        right: 3px;
        width: 22px;
        height: 22px;
        border-radius: 50%;
      }

      .item-content {
        width: 100%;
      }

    }

    .holiday .item-title::after {
      content: '休';
      position: absolute;
      top: -10px;
      right: 10px;
      color: $holiday;
      font-size: 12px;
    }

    .work .item-title::after {
      content: '补';
      position: absolute;
      top: -10px;
      right: 10px;
      color: $work;
      font-size: 12px;
    }

    .leave.full .item-title::after {
      content: '假';
      position: absolute;
      top: -10px;
      right: 10px;
      color: $leave;
      font-size: 12px;
    }

    .leave.lite .item-title::after {
      content: '假半';
      position: absolute;
      top: -10px;
      right: 10px;
      color: $leave;
      font-size: 12px;
    }

    .today {
      background-color: rgba(42, 113, 128, 0.5);
      border-radius: 50%;
    }

    // 空格子
    .empty {
      color: rgba(245, 245, 245, 1);
    }

    // 法定节假日
    .holiday {
      color: $holiday;
    }

    // 双休日
    .rest {
      color: $rest;
    }

    // 正常
    .normal {
      color: $normal;
    }

    // 全天缺卡
    .none {
      color: $none;
    }

    // 缺上班卡
    .none-up {
      color: $none-up;
    }

    // 缺下班卡
    .none-down {
      color: $none-down;
    }

    // 没有打工时卡
    .wt-none {
      color: $wt-none;
    }

  }


}

</style>
