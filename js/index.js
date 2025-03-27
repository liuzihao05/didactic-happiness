/* mybooks.js */

/* 3. 交互行为设计 */
// 3.1 系统变量初始化
let db = null; // 定义保存数据对象结果集的变量
let request, objStore;
const DBName = "myBooks", DBVersion = 1; // 定义数据库名称和版本号

const bookLists = [
    { title: "Web 前端开发技术 - Html、Css、JavaScript", author: "储久良", isbn: "9787302431695" },
    { title: "计算机组成原理(修订版)", author: "张功萱", isbn: "9787302433637" },
    { title: "HTML/CSS/JavaScript 标准教程", author: "本书编委会", isbn: "9787121079344" },
    { title: "HTML+CSS 网页设计与布局从入门到精通", author: "温谦", isbn: "9787115183392" },
    { title: "Java 2 实用教程(第5版)", author: "耿祥义", isbn: "9787302464259" }
];

// 3.2 浏览器的支持判断
const indexedDB = window.indexedDB || window.mozIndexedDB || window.msIndexedDB || window.webkitIndexedDB;

// 3.3 定义创建 indexedDB 数据库的方法，并监听 3 个事件
function createDB(dbName, dbVersion) {
    request = indexedDB.open(dbName, dbVersion); // 返回一个 IDBRequest 对象

    request.onerror = (event) => {
        alert("打开数据库失败：" + event.target.errorCode);
        console.log("打开数据库失败：" + event.target.errorCode);
    };

    request.onsuccess = (event) => {
        alert("打开数据库成功!");
        db = event.target.result; // 给 db 赋值
        const transaction = db.transaction(["books"], "readwrite");
        objStore = transaction.objectStore("books"); // 创建 books 对象仓库
    };

    request.onupgradeneeded = (event) => {
        alert("版本变化! 版本号为" + event.newVersion);
        console.log("版本变化!" + event.newVersion);
        db = event.target.result; // 为 books 对象仓库创建事件对象

        if (!db.objectStoreNames.contains("books")) { // 如果不存在，则创建
            objStore = db.createObjectStore("books", { keyPath: "isbn" }); // 创建对象仓库
            objStore.createIndex("by_title", 'title', { unique: false });
            objStore.createIndex("by_author", 'author', { unique: false });
            objStore.createIndex("by_isbn", 'isbn', { unique: true });
        }
        loadBooks(); // 初始化图书
        window.location.reload();
        window.location.hash = "#list";
        $("booklist").value = "";
    }
}

// 3.4 启动创建数据库事件处理程序
window.onload = () => {
    createDB(DBName, DBVersion); // 数据库初始化
};

const $ = (id) => document.getElementById(id);

function loadBooks() { // 初始化加载图书
    $("booklist").value = ""; // 加载前先清空列表
    alert("开始装载图书....");
    const transaction = db.transaction("books", "readwrite");
    const objStore = transaction.objectStore("books");

    for (const book of bookLists) {
        const request = objStore.put(book); // put 存在则更新，不存在则添加对象到 books 中
        request.onerror = () => {
            console.error('数据库中已有该对象，不能重复添加!!');
        };
        request.onsuccess = () => {
            console.log('对象已成功存入对象仓库中!');
        };
    }
}

function showBooks() { // 显示所有图书
    const query = document.forms.list.query.value;
    $("booklist").value = ""; // 加载前先清空列表
    const transaction = db.transaction(["books"], "readonly"); // 为 books 定义只读事件
    const objStore = transaction.objectStore("books"); // 获取 books 对象仓库
    const index = objStore.index("by_title"); // 按 title 进行索引
    const range = IDBKeyRange.bound(query, query + "z"); // 生成范围 range 对象
    const result = (query.length > 0) ? index.openCursor(range) : index.openCursor();
    let i = 1;

    result.onsuccess = (e) => { // 打开索引游标，启动成功监听事件
        const cursor = e.target.result; // 获取结果集
        if (cursor) {
            // 通过控制台输出相关信息
            console.log(cursor.value.author + ", " + cursor.value.isbn);
            cursor.continue(); // 继续游标
        }
    };
}

function addBook() { // 添加一本图书进入客户端图书库
    const title = document.add.title.value;
    const author = document.add.author.value;
    const isbn = document.add.isbn.value;
    const onebook = { title, author, isbn };

    if (title && author && isbn) {
        const transaction = db.transaction("books", "readwrite");
        const objStore = transaction.objectStore("books"); // 获取 books 对象仓库
        const request1 = objStore.add(onebook);
        transaction.oncomplete = () => {
            alert("图书成功添加! 界面即将被清空!");
            document.forms.add.title.value = "";
            document.forms.add.author.value = "";
            document.forms.add.isbn.value = "";
            window.location.reload();
        };
    }
}

function deleteDatabase() {
    if (indexedDB) {
        indexedDB.deleteDatabase(DBName); // 使用 DBName
        alert("数据库删除成功，即将重新初始化...");
        window.location.reload();
    }
}

function deleteAllBooks() {
    const transaction = db.transaction("books", "readwrite");
    const objStore = transaction.objectStore("books");
    objStore.clear();
    transaction.oncomplete = () => {
        alert("所有图书清除成功!");
    };
    transaction.onerror = () => {
        alert("所有图书清除失败!");
    };
}

// 监听 hashchange 事件，并绑定事件处理函数
// 根据 hash 值，动态地给 body 修改 class 属性的值
// 完成 Section 随导航自动切换
window.addEventListener('hashchange', () => {
    switch (location.hash) {
        case "#add":
            document.body.className = "add";
            break;
        case "#setting":
            document.body.className = "setting";
            break;
        default:
            document.body.className = "list";
    }
}, false);
