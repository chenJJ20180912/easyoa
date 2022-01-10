import {jsonPost, postForm} from "@/http/index";
import {setCurUser} from "@/cache";
import dateUtils from "an-easy-toolkit/src/funs/dateUtils";


/**
 * 登录
 * @param code
 * @param pwd
 * @returns {Promise<void>}
 */
export function login(code, pwd) {
    const params = {
        login_username: code,
        login_password: pwd,
        login_validatePwdStrength: 4
    }
    return postForm("/seeyon/main.do?method=login", params).then(resp => {
        // 将当前用户设置到缓存中
        setCurUser({code, pwd})
    })
}


/**
 * 加载打卡信息
 * @param startDate 开始时间
 * @param endDate 结束时间
 */
export function getAttendanceRecord(startDate, endDate) {
    const params = {
        "elementType": "6",
        "dataInfo": {
            "bindAuthId": "1533571737190483907",
            "page": "1",
            "formId": "7128742566509166264",
            "type": "data",
            "userOrderBy": [],
            "pageSize": "500",
            "userConditions": [{
                "aliasTableName": "formmain_0206",
                "rowOperation": "and",
                "fieldName": "field0007",
                "rightChar": ")",
                "leftChar": "(",
                "operation": "GreatEqual",
                "fieldValue": dateUtils.dateToString(startDate, "yyyy-MM-dd HH:mm")
            }, {
                "aliasTableName": "formmain_0206",
                "rowOperation": "and",
                "fieldName": "field0007",
                "rightChar": ")",
                "leftChar": "(",
                "operation": "LessEqual",
                "fieldValue": dateUtils.dateToString(endDate, "yyyy-MM-dd HH:mm")
            }]
        },
        "dynamicKey": "5C525E3D-3398-4EDD-8905-82CDB9DA8608"
    }
    return jsonPost("/seeyon/rest/cap4/template/getDataByRealParams", params)
}

/**
 * 加载请假数据
 * @param startDate 开始日期
 * @param endDate 结束日期
 */
export function getLeaveRecord(startDate, endDate) {
    const params = {
        "elementType": "1",
        "dataInfo": {
            "queryId": "7695688655049280513",
            "page": 1,
            "pageSize": "500",
            "userConditions": []
        },
        "dynamicKey": "BC8CA80D-9921-4505-83F6-05C1120B0450"
    }
    return jsonPost("/seeyon/rest/cap4/template/getDataByRealParams", params)
}


/**
 * 加载工时打卡数据
 * @param startDate
 * @param endDate
 */
export function getWorkTimeAttendanceRecord(startDate, endDate) {
    let params = {
        managerMethod: "getSentList",
        arguments: [{"page": 1, "size": 200},
            {
                "subject": "",
                "templateName": "工时打卡",
                "importantLevel": "",
                "createDate": dateUtils.dateToString(startDate, "yyyy-MM-dd") + "#" + dateUtils.dateToString(endDate, "yyyy-MM-dd"),
                "affairArchiveId": "",
                "deadlineDatetime": "#",
                "receiver": "",
                "workflowState": "1"
            }]
    }
    return postForm("/seeyon/ajax.do?method=ajaxAction&managerName=colManager&rnd=" + parseInt(Math.random() * 100000), params)
}
