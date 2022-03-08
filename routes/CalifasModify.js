const express = require("express");
const conn = require("../utilityes/DbConection")

const router = express.Router()

router.post("/uploadCalif",(req,res) =>{
    let califas = req.body;
    console.log("/uploadCalif")

    let petitionsProcces = []

    califas.forEach(
        petition => petitionsProcces.push(checkPetition(petition)))
        
    Promise.all(petitionsProcces).then(() => res.sendStatus(200))
})

async function checkPetition(petition){
    let claveCal = await manageClaveCal(petition);

    manageEvaPetitions(petition.evaPetitions,claveCal,petition.type)
    manageSem(petition,claveCal)
    
}

function manageEvaPetitions(evaPetitions,claveCal,type){
    let table

    if (type === "num")
        table = "calificaciones_numericas"
    else if(type === "bol") 
        table = "calificaciones_booleanas"
    

    evaPetitions.forEach(evaPetition => {
        if (evaPetition.evaMustBeCreated)
            storeEva(evaPetition.data,claveCal,table)
        else
            modifyEva(evaPetition.data,claveCal,table)
        
    });    
}



function deleteCalifaFromTable(claveCal,table){
    sendUpdate(
        "delete from " + table + " where calificacion_clave = '" + claveCal + "'"
    )
}

function modifyEva(evaData,claveCal,table){
    let calif = parseValue("calificacion",evaData.calificacion)
    let falt = parseValue("faltas",evaData.faltas)
    if(calif && falt) 
        calif+="," 

    sendUpdate(
        "update " + table + " set " + calif + falt +
        " where calificacion_clave = '" + claveCal + "' and evaluacion = '" + evaData.evaluacion + "'")
}

function parseValue(valueName,value){
    if( value === undefined)
        return ""

    return valueName + " = " + translateValue(value)
}


function translateValue(value){
    if( value === undefined || value === "")
        return "null"

    return value
}

function storeEva(data,claveCal,table){
    let parsedCal = translateValue(data.calificacion)
    let parsedFal = translateValue(data.faltas)
    
    sendUpdate(
        "insert into " + table + "(calificacion_clave,evaluacion,calificacion,faltas) values " +
        "('" + claveCal +"','"+ 
        data.evaluacion +"',"+
        parsedCal +
        "," +
        parsedFal +
        ")"
    )
}

function manageSem(petition,claveCal){
    if(petition.semestralCalif !== undefined){
        if(petition.semestralCalifMustBeCreated) {
            if(petition.semestralCalif !== "")
                createSemestreCalif(claveCal,petition.semestralCalif)
            }else{
                if(petition.semestralCalif)
                    modifySemestreCalif(claveCal,petition.semestralCalif)
                else
                    deleteCalifaFromTable(claveCal,"calificaciones_semestrales")
            }
    }
}

function createSemestreCalif(claveCal,semestralCalif){
    sendUpdate(
        "insert into calificaciones_semestrales(calificacion_clave,calificacion) values ('"
        + claveCal + "','" +semestralCalif+ "')"
    )
}

function modifySemestreCalif(claveCal,semestralCalif){
    sendUpdate("update calificaciones_semestrales set calificacion = " 
        + semestralCalif + " where calificacion_clave = '" + claveCal + "'")
}

function manageClaveCal(petition){
    return new Promise(resume =>{
        if(petition.calificacion_clave)
            resume(petition.calificacion_clave) 
        else
            createCalClave(petition.materia,petition.numero_control,petition.semestre,petition.periodo)
            .then(calificacion_clave => resume(calificacion_clave))
    })
    
}

function createCalClave(materia,numero,semestre){
    return new Promise(resume=>{
        conn((err, connection) => {
            getCurrentPeriodo().then(periodo => {
                let query = 
                "insert into calificaciones( materia,clave_alumno,semestre,periodo) values " +
                "('" + materia +"','"+ numero +"','"+ semestre +"','"+ periodo +"')";
                console.log(query)
                connection.query(query, (error, results, felds) => {
                    getCalClave(materia,numero,semestre,periodo).then(clave =>resume(clave))
                    
                })
            })

        })
    })
}

function getCalClave(materia,numero,semestre,periodo){
    return new Promise(resume =>{
        conn((err, connection) => {
            let query = 
            "select calificacion_clave from calificaciones where materia = '" 
            + materia +
             "' and clave_alumno = '" + numero +
             "' and semestre = '" + semestre  +
             "' and periodo = '" + periodo + "'"
            console.log(query)
            connection.query(query, (error, results, felds) => {
                resume(results[0].calificacion_clave)
                
            })
        })
    })

}

function getCurrentPeriodo(){
    return new Promise(resume =>{
        conn((err, connection) => {
            let query = "select periodo from currentperiodo"
            connection.query(query, (error, results, felds) => {
                resume(results[0].periodo)
                
            })
        })
    })

}

function sendUpdate(query){
    return new Promise(resume=>{
        conn((err, connection) => {
            connection.query(query, (error, results, felds) => {
                console.log(query,error)
                resume()
                
            })
        })
    })
}

module.exports = router