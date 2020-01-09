const express = require('express')
const app = express()
const sqlite = require('sqlite')
const bodyParser = require('body-parser')
const dbConnection = sqlite.open('banco.sqlite', { Promise })
const port = process.env.PORT || 4000

app.set('view engine', 'ejs')
// Caso não encontre a URL pega qualquer coisa na pasta pública
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended:true}))

app.get('/', async(request, response) => {
    // response.send('<h1>Olá Fullstack Lab</h1>')
    const db = await dbConnection
    const categoriasDB = await db.all('SELECT * FROM categorias;')
    const vagas = await db.all('SELECT * FROM vagas;')
    const categorias = categoriasDB.map(cat => {
        return {
            ...cat,
            vagas: vagas.filter(vaga => vaga.categoria === cat.id)
        }
    })
    response.render('home', {
        categorias
    })
})

app.get('/vaga/:id', async(req, res) => {
    const db = await dbConnection
    const vaga = await db.get('SELECT * FROM vagas WHERE id = ' + req.params.id)
    res.render('vaga', {
        vaga
    })
})

app.get('/admin', (req, res) => {
    res.render('admin/home-admin')
})

app.get('/admin/vagas', async(req, res) => {
    const db = await dbConnection
    const vagas = await db.all('SELECT * FROM vagas;')
    res.render('admin/vagas', { vagas })
})

app.get('/admin/vagas/delete/:id', async(req, res) => {
    const db = await dbConnection
    // await db.rub('DELETE FROM vagas WHERE id = ' + req.params.id + 'limit 1')
    await db.run(`DELETE FROM vagas WHERE id = ${req.params.id}`)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/criarVagas', async(req, res) => {
    const db = await dbConnection
    const categorias = await db.all('SELECT * FROM categorias')
    res.render('admin/nova-vaga', {categorias})
})

app.post('/admin/vagas/criarVagas', async(req, res) => {
    const db = await dbConnection
    const {titulo, descricao, categoria} = req.body
    await db.run(`insert into vagas(categoria, titulo, descricao) values(${categoria}, '${titulo}', '${descricao}')`)
    res.redirect('/admin/vagas')
})

app.post('/admin/vagas/editarVagas/:id', async(req, res) => {
    const db = await dbConnection
    const {titulo, descricao, categoria} = req.body
    const { id } = req.params
    await db.run(`update vagas set categoria = '${categoria}', titulo = '${titulo}', descricao = '${descricao}' where id = ${id}`)
    res.redirect('/admin/vagas')
})

app.get('/admin/vagas/editarVagas/:id', async(req, res) => {
    const db = await dbConnection
    const categorias = await db.all('SELECT * FROM categorias')
    const vaga = await db.get(`SELECT * FROM vagas WHERE id = ${req.params.id}`)
    res.render('admin/editar-vaga', {categorias, vaga})
})

app.get('/admin/category', async(req, res) => {
    const db = await dbConnection
    const categories = await db.all('SELECT * FROM categorias')
    res.render('admin/category', {categories})
})

app.get('/admin/category/createCategory', async(req, res) => {
    res.render('admin/nova-categoria')
})

app.post('/admin/category/createCategory', async(req, res) => {
    const db = await dbConnection
    const {categoria} = req.body
    await db.run(`INSERT INTO categorias(categoria) VALUES('${categoria}')`)
    res.redirect('/admin/category')
})

app.get('/admin/category/delete/:id', async(req, res) => {
    const db = await dbConnection
    await db.run(`DELETE FROM categorias WHERE id = ${req.params.id}`)
    res.redirect('/admin/category')
})

app.get('/admin/category/editarCategory/:id', async(req, res) => {
    const db = await dbConnection
    const categoria = await db.get(`SELECT * FROM categorias WHERE id = ${req.params.id}`)
    res.render('admin/edit-category', {categoria})
})

app.post('/admin/category/editarCategory/:id', async(req, res) => {
    const db = await dbConnection
    const {categoria} = req.body
    const { id } = req.params
    await db.run(`UPDATE categorias SET categoria = '${categoria}' WHERE id = ${id}`)
    res.redirect('/admin/category')
})

const init = async() => {
    const db = await dbConnection
    await db.run('CREATE TABLE if not exists categorias (id INTEGER PRIMARY KEY, categoria TEXT);')
    await db.run('CREATE TABLE if not exists vagas (id INTEGER PRIMARY KEY, categoria INTEGER, titulo TEXT, descricao TEXT);')
    // const categoria = 'Marketing team'
    // await db.run(`insert into categorias(categoria) values('${categoria}')`)
    // const vaga = 'Social Midia (San Francisco)'
    // const descricao = 'Vaga para social midia que fez o Fullstack Lab'
    // await db.run(`insert into vagas(categoria, titulo, descricao) values(2, '${vaga}', '${descricao}')`)
}

init()

app.listen(port, (err) => {
    err ? console.log('Não foi possível iniciar o servidor do Jobify') : console.log('Servidor do Jobify rodando')
})