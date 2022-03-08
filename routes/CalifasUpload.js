const express = require("express")
const route = express.Router()

const conn = require("../utilityes/DbConection")


route.get("/gruposProfesor",(req,res)=>{
    let profesor = req.user.user
    console.log("/gruposProfesor")
    getProfeGrupos(profesor).
        then((result)=>{
            res.json(result)
        }).
        catch(error => res.sendStatus("400"))
})

route.get("/grupoCalif/:grupo/:materia",(req,res)=>{
    console.log("/grupoCalif/:grupo/:materia")
    let profesor = req.user.user
    let materia = req.params.materia
    let grupo = req.params.grupo

    chekPermisionsOver(profesor,materia,grupo).then(() => {
        getAlumnosCalifas(grupo,materia).
        then(
            califas => {
                res.json(califas)
            }
        )
    }).catch(()=>res.sendStatus(401))

})

function chekPermisionsOver(profesor,materia,grupo){
    return new Promise((resolve,reject) =>{
        conn((err, connection) => {
            let query = 
            "select materia from asignaturas_visible_view where profesor = '" 
            + profesor +"' and " + 
            "materia = '" + materia + "' and " +
            "grupo = '" + grupo + "'" 

            connection.query(query, (error, results, felds) => {
                if (error || results.length == 0)
                    return reject(error)
                else
                    return resolve()
            })
        })
    })
}

function getProfeGrupos(profesor){
    return new Promise((resolve,reject) =>{
        conn((err, connection) => {
            let query = 
            "select grupo,materia,nombre_abr from asignaturas_visible_view where profesor = '" + profesor +"'";
            connection.query(query, (error, results, felds) => {
                if (error)
                    return reject(error)
                else
                    return resolve(results)
            })
        })
    })
}

function getAlumnosCalifas(grupo,materia){
    return new Promise(resume =>{
        Promise.all([
            getGrupoCalificaciones(grupo,materia),
            getGrupoAlumnos(grupo)

        ]).then( data => {
            let califa = data[0] 
                califa.alumnos = data[1] 

            resume(califa)
        })
    })
}

function getGrupoAlumnos(grupo){
    return new Promise((resolve,reject) =>{
        conn((err, connection) => {
            let query = 
            "select numero_control,nombre_completo,numero_lista,semestre from alumnos_visible_view where grupo = '" + grupo +"'";
            connection.query(query, (error, results, felds) => {
                if (error)
                    return reject(error)
                else
                    return resolve(results)
                }
            )
        })
    })
}


function getGrupoCalificaciones(grupo,materia){
    return new Promise(
        (resolve) => {
            let califas = {}
            materiaIsbol(materia).then(
                isBol => {
                    if(isBol){
                        califas.type = "bol"
                        getBolData(grupo,materia).then(
                            bolData =>{
                                califas.data = bolData
                                resolve(califas)
                            }
                        )
                    } else {
                        califas.type = "num"
                        getNumData(grupo,materia).then(
                            numData => {
                                califas.data = numData[0]
                                califas.sem = numData[1]
                                resolve(califas)
                            }
                        )
                    }
                }
    )


            
                
            
        }
    )




}

function getBolData(materia,grupo){
    return getMateriaEva("bol_calif_full_eval",grupo,materia)
}

function getNumData(materia,grupo){
    return Promise.all(
        [
            getMateriaEva("num_calif_full_eval",grupo,materia),
            getMateriaEva("sem_calif_full_eval",grupo,materia),
        ]) 
}

function getMateriaEva(procedure,materia,grupo){
    return new Promise((resolve,reject) =>{
        
        conn((err, connection) => {
            let query = 
            "call " + procedure + "('" + grupo + "','" + materia + "')";
            connection.query(query, (error, results, felds) => {
                if (error)
                    return reject(error)
                else
                    return resolve(results[0])
                
                }
            )
        })
    })
}


function materiaIsbol(materia){
    return new Promise((resolve,reject) =>{
        conn((err, connection) => {
            let query = 
            "select tipo_calificacion from materias where clave_materia = '" + materia +"'";
            connection.query(query, (error, results, felds) => {
                
                if (error)
                    return reject(error)
                else
                    return resolve(
                        
                        results[0].tipo_calificacion === "A/NA")
                
            })
        })
    })

}

module.exports = route