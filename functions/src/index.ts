import * as functions from 'firebase-functions';import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import * as bodyParser from "body-parser";
admin.initializeApp(functions.config().firebase);
const db = admin.firestore();
const app = express();
const main = express();
const collectionName = 'metrics';
main.use(cors())
main.use('/api/v1', app);
main.use(bodyParser.json());
main.use(bodyParser.urlencoded({ extended: false }));// webApi is your functions name, and you will pass main as 
// a parameter
export const webApi = functions.https.onRequest(main);

// Add new metric

app.post('/metrics', async (req, res) => {
    try {
        const newDoc = await db.collection(collectionName).add(req.body);
        res.status(201).send(`Created a new metric: ${newDoc.id}`);
    } catch (error) {
        res.status(400).send(`Invalid Fields`)
    }        
})
// Update new metric

app.patch('/metrics/:metricId', async (req, res) => {
    const updatedDoc =await db.collection(collectionName).doc(req.params.metricId).set(req.body, {
        merge: true 
    });
    res.status(204).send(`Update a new metric: ${updatedDoc}`);
    
})

// View a metric
app.get('/metrics/:metricId', async (req, res) => {
    try{
    const getDoc = await db.collection(collectionName).doc(req.params.metricId).get()
    res.status(200).send(getDoc.data())
        }  
        catch(error){
            res.status(400).send(`Cannot get metric: ${error}`);
        }
})


// View all metrics

app.get('/metrics', async (req, res, next) => {
    try {
        let limit = 100
        let offset = 0
        let severity = "all"
        let severityFilters = ["high","medium","normal","low"]
        let sortDir: "asc" | "desc" = "asc"
        let startDate = "2020-08-24 00:00:00"
        let endDate = "2020-09-01 00:00:00"
        let query:any = db.collection(collectionName)
        if (req.query ) {
            if(req.query.limit) { limit = parseInt((req.query as any).limit); }
            if(req.query.offset) { offset = parseInt((req.query as any).offset); }
            if(req.query.sortDir) { sortDir = ((req.query as any).sortDir);}
            if(req.query.severity) { 
                severity = ((req.query as any).severity);
                if(severity !== "all"){
                    severityFilters = [severity]
                }
            } 
            if(req.query.startDate) { startDate = ((req.query as any).startDate);}
            if(req.query.endDate) { endDate = ((req.query as any).endDate);}
            if(req.query.siteId) { query = query.where('siteId','==',((req.query as any).siteId))}
            if(req.query.assetId) { query = query.where('assetId','==',((req.query as any).assetId))}
            if(req.query.sensorId) { query = query.where('sensorId','==',((req.query as any).sensorId))}
        }
        const docRef = await query.where('readingTimestamp','>=',startDate).where('readingTimestamp','<=',endDate).where('severity','in',severityFilters).orderBy("readingTimestamp",sortDir).limit(limit).offset(offset).get();
        const result:any = [];
        docRef.forEach((doc:any) => {
            result.push({
                id: doc.id,
                data: doc.data()
            });
        });
        res.json(result);
    } catch(e) {
        next(e);
    }
})


// Delete a metric 

app.delete('/metrics/:metricId', async (req, res) => {
    const deletedDoc = await db.collection(collectionName).doc(req.params.metricId).delete();
    res.status(204).send(`Metric is deleted: ${deletedDoc}`);
})