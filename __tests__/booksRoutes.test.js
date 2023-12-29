process.env.NODE_ENV = "test";

const db = require("../db");

const request = require("supertest");
const app = require("../app");


// isbn of sample book
let book_isbn;

describe("Books Routes Test", function () {
    beforeEach(async function () {
        await db.query("DELETE FROM books")
        let result = await db.query(`
        INSERT INTO
          books (isbn, amazon_url,author,language,pages,publisher,title,year)
          VALUES(
            '123432122',
            'https://amazon.com/taco',
            'Elie',
            'English',
            100,
            'Nothing publishers',
            'my first book', 2008)
          RETURNING isbn`);

        book_isbn = result.rows[0].isbn
    });

    /** Get /books */
    describe("GET /books", function () {
        test("can get books", async function () {
            let response = await request(app).get("/books")

            expect(response.body).toEqual({
                books: [
                    {
                        "isbn": '123432122',
                        "amazon_url": 'https://amazon.com/taco',
                        "author": 'Elie',
                        "language": 'English',
                        "pages": 100,
                        "publisher": 'Nothing publishers',
                        "title": 'my first book',
                        "year": 2008
                    }
                ]
            })
        })
    })

    /** Get /books/:id */
    describe("GET /books/:id", function () {
        test("can get one book", async function () {
            let response = await request(app).get(`/books/${book_isbn}`)

            expect(response.body).toEqual({
                book:
                {
                    "isbn": '123432122',
                    "amazon_url": 'https://amazon.com/taco',
                    "author": 'Elie',
                    "language": 'English',
                    "pages": 100,
                    "publisher": 'Nothing publishers',
                    "title": 'my first book',
                    "year": 2008
                }
            })
        })
    })

    describe("POST /books", function () {
        test("can create book", async function () {
            let response = await request(app)
                .post("/books/")
                .send({
                    "isbn": "8761161518",
                    "amazon_url": "http://a.co/eobPtX2",
                    "author": "Dr. Seuss",
                    "language": "english",
                    "pages": 44,
                    "publisher": "Princeton University Press",
                    "title": "The Cat in the Hat",
                    "year": 1980
                });

            expect(response.statusCode).toBe(201);
            expect(response.body.book).toHaveProperty("isbn");
        });

        test("cannot create without isbn", async function () {
            let response = await request(app)
                .post("/books/")
                .send({
                    "amazon_url": "http://a.co/eobPtX2",
                    "author": "Dr. Seuss",
                    "language": "english",
                    "pages": 44,
                    "publisher": "Princeton University Press",
                    "title": "The Cat in the Hat",
                    "year": 1980
                });
            expect(response.statusCode).toEqual(400);
        });
    });

    describe("PUT /books/:isbn", function () {
        test("can update book", async function () {
            let response = await request(app)
                .put(`/books/${book_isbn}`)
                .send({
                    "amazon_url": "http://a.co/eobPtX2",
                    "author": "Dr. Seuss",
                    "language": "english",
                    "pages": 44
                });
            expect(response.body.book.author).toBe("Dr. Seuss");
            expect(response.body.book).toHaveProperty("isbn");
        });

        test("cannot update with wrong field", async function () {
            let response = await request(app)
                .put(`/books/${book_isbn}`)
                .send({
                    "amazon_url": "http://a.co/eobPtX2",
                    "bad_field": "bogus",
                    "language": "english",
                    "pages": 44,
                    "publisher": "Princeton University Press",
                    "title": "The Cat in the Hat",
                    "year": 1980
                });
            expect(response.statusCode).toEqual(400);
        });

    });
    describe("DELETE /books/:isbn", function () {
        test("can delete book", async function () {
            let response = await request(app)
                .delete(`/books/${book_isbn}`)

            expect(response.statusCode).toEqual(200);
            expect(response.body).toEqual({ message: "Book deleted" })
        });
        test("cannot find book to delete", async function () {
            let response = await request(app)
                .delete(`/books/00000`)
            expect(response.statusCode).toEqual(404);
        });
    });
})
afterAll(async function () {
    await db.end();
});
