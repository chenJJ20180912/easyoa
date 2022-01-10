/**
 * 节假日维护
 * @type {*[]}
 */
import dateUtils from "an-easy-toolkit/src/funs/dateUtils";

// 节假日模板
const holidayTemplate = [
    '2021-10-01~2021-10-07',
    '2022-01-01~2022-01-03'
]
// 工作日模板
const workdayTemplate = [



]

// 解析模板
function parseTemplate(template) {
    let arr = []
    template.forEach(item => {
        const ss = item.split("~")
        if (ss.length === 1) {
            arr.push(ss)
        } else {
            arr = arr.concat(dateUtils.getDatesInRange(ss[0], ss[1], false))
        }
    })
    return arr
}

// 根据模板解析出工作日和节假日
const holidays = parseTemplate(holidayTemplate)
const workdays = parseTemplate(workdayTemplate)

/**
 * 判断当天是否为工作日，调休
 * @param date
 * @returns {boolean}
 */
export function isWorkday(date) {
    return workdays.includes(dateUtils.dateToString(date,dateUtils.date_formatter_short))
}

/**
 * 判断当天是否为节假日
 * @param date
 * @returns {boolean}
 */
export function isHoliday(date) {
    return holidays.includes(dateUtils.dateToString(date,dateUtils.date_formatter_short))
}