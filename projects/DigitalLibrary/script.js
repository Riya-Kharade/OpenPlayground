let books = [
    {title:"Python Basics", author:"John Smith", available:true},
    {title:"Data Science Handbook", author:"Jake VanderPlas", available:true},
    {title:"Machine Learning Guide", author:"Andrew Ng", available:true}
];

function displayBooks(){

    let bookList = document.getElementById("bookList");
    bookList.innerHTML="";

    books.forEach((book,index)=>{

        let div = document.createElement("div");
        div.className="book";

        div.innerHTML = `
        <h3>${book.title}</h3>
        <p>Author: ${book.author}</p>
        <p>Status: ${book.available ? "Available":"Not Available"}</p>
        <button onclick="addToReading(${index})">Add to Reading List</button>
        `;

        bookList.appendChild(div);

    });

}

function addBook(){

    let title = document.getElementById("title").value;
    let author = document.getElementById("author").value;

    if(title && author){

        books.push({
            title:title,
            author:author,
            available:true
        });

        displayBooks();

        document.getElementById("title").value="";
        document.getElementById("author").value="";
    }
}

function searchBook(){

    let input = document.getElementById("search").value.toLowerCase();
    let bookDivs = document.getElementsByClassName("book");

    for(let i=0;i<bookDivs.length;i++){

        let title = bookDivs[i].getElementsByTagName("h3")[0].innerText.toLowerCase();

        if(title.includes(input)){
            bookDivs[i].style.display="";
        }
        else{
            bookDivs[i].style.display="none";
        }

    }
}

function addToReading(index){

    let readingList = document.getElementById("readingList");

    let li = document.createElement("li");
    li.textContent = books[index].title;

    readingList.appendChild(li);

}

displayBooks();