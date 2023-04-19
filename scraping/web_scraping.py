import time
import re
import csv
import requests
from bs4 import BeautifulSoup
from selenium import webdriver
from selenium.webdriver.chrome.options import Options


def init():
    # Set up ChromeOptions to use headless browsing
    chrome_options = Options()
    chrome_options.add_argument('--headless')

    # Create a ChromeDriver instance
    return webdriver.Chrome(options=chrome_options)


def crawlPage(driver):
    # Send a GET request to the website
    url = "https://appsumo.com/"
    driver.get(url)

    # Wait for the JavaScript content to load
    driver.implicitly_wait(10)

    # Scroll to the bottom of the page to load all the content
    driver.execute_script("window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });")

    # Wait for 5 seconds to allow content to load
    time.sleep(3)

    # Get the HTML content of the page
    return driver.page_source


def parseHtml(html):
    # Create a BeautifulSoup object to parse the HTML content
    return BeautifulSoup(html, "html.parser")


def findSections(soup):
    # Find all div elements with class "smart-collection-section"
    smartCollectionSection = soup.find_all("div", class_="smart-collection-section")
    print("Total Containers: " + str(len(smartCollectionSection)))
    return smartCollectionSection


def filterContainer(smartCollectionSection):
    # Find the index of the first div element that has a child class of ".product-carousel"
    index = None
    for i, section in enumerate(smartCollectionSection):
        try:
            title = section.find(class_="product-carousel").find(class_="product-carousel-title").find("h3").find(
                "a").find(
                "span").text
            if title == "Customer favorites":
                index = i
                break
        except AttributeError:
            pass
    print("Container Index: " + str(index))
    return index


def findProducts(smartCollectionSection):
    productCarousel = smartCollectionSection.find(class_="product-carousel")
    wrapper = productCarousel.find(class_="wrapper")
    flickingViewport = wrapper.find(class_="flicking-viewport")
    flickingCamera = flickingViewport.find(class_="flicking-camera")
    return flickingCamera.find_all(class_="carousel-cell")


def extract_item_details(item):
    elementCard = item.select_one(".sku-card-wrapper .sku-card")
    cardImage = elementCard.find(class_="card-img-container")

    # Body
    cardBody = elementCard.select_one(".card-body")
    cardName = " ".join(cardBody.select_one(".deal-name-container").text.split())
    cardDesc = " ".join(cardBody.select_one(".deal-description").text.split())

    # Footer
    cardFooter = elementCard.find(class_="card-footer")
    price = cardFooter.find(class_="pricing-text").text.strip()
    plan = cardFooter.find(class_="plan-text").text.replace("/", "").strip()
    originalPrice = cardFooter.find(class_="plan-original-price").text.replace("/", "").strip()

    return {
        "name": cardName,
        "description": cardDesc,
        "price": price,
        "plan": plan,
        "originalPrice": originalPrice,
    }


driver = init()
html = crawlPage(driver)
soup = parseHtml(html)

# Find container elements containing data
smartCollectionSection = findSections(soup)

# Filter customer favorites container
index = filterContainer(smartCollectionSection)

# Find customer fav. products
items = findProducts(smartCollectionSection[index])
csvData = []
for item in items:
    data = extract_item_details(item)
    csvData.append(data)

print(csvData)

# Close the ChromeDriver instance
driver.quit()

# Create a CSV file to store the product data
with open("customer_favorites.csv", "w", newline="") as file:
    writer = csv.writer(file)
    writer.writerow(["Name", "Description", "Price", "Plan", "Original Price"])
    for item in csvData:
        writer.writerow([
            item['name'],
            item['description'],
            item['price'],
            item['plan'],
            item['originalPrice']
        ])