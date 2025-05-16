from flask import Flask, render_template, request, jsonify
import requests

app = Flask(__name__)

# OpenStreetMap Nominatim API endpoint
NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

# Set a User-Agent header (replace with your application's name)
HEADERS = {'User-Agent': 'MyGeocoderWebApp/1.0 (adarsh.v@atherenergy.com)'}  # Replace with your info

@app.route("/", methods=["GET", "POST"])
def index():
    coordinates = None
    error_message = None

    if request.method == "POST":
        search_query = request.form["search_query"]

        try:
            params = {
                "q": search_query,
                "format": "json",
                "limit": 1,
                "countrycodes": "in" 
            }
            response = requests.get(NOMINATIM_URL, params=params, headers=HEADERS)
            response.raise_for_status()

            results = response.json()

            if results:
                coordinates = {
                    "latitude": results[0]["lat"],
                    "longitude": results[0]["lon"]
                }
            else:
                error_message = "No results found for your search query."

        except requests.exceptions.RequestException as e:
            error_message = f"An error occurred: {e}"
        except Exception as e:
            error_message = f"An unexpected error occurred: {e}"

    return render_template("index.html", coordinates=coordinates, error_message=error_message)


@app.route("/autocomplete")
def autocomplete():
    query = request.args.get("q")
    if not query:
        return jsonify([])  # Return an empty list if no query

    try:
        params = {
            "q": query,
            "format": "json",
            "limit": 5,  # Adjust the number of suggestions as needed
            "countrycodes": "in"
        }
        response = requests.get(NOMINATIM_URL, params=params, headers=HEADERS)
        
        response.raise_for_status()
        results = response.json()

        suggestions = []
        for result in results:
            suggestions.append({
                "display_name": result["display_name"],
                "latitude": result["lat"],
                "longitude": result["lon"]
            })

        return jsonify(suggestions)

    except requests.exceptions.RequestException as e:
        print(f"Autocomplete error: {e}")  # Log the error on the server
        return jsonify([])  # Return an empty list in case of error


if __name__ == "__main__":
    app.run(debug=True)