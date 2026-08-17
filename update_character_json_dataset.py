import os
import json

def main():
    dataset_index_path = os.path.join("dataset", "dataset_index.json")
    if not os.path.exists(dataset_index_path):
        print("Error: dataset_index.json not found!")
        return

    with open(dataset_index_path, "r", encoding="utf-8") as f:
        ds_data = json.load(f).get("characters", {})

    char_dir = "characters"
    updated_count = 0

    for filename in os.listdir(char_dir):
        if filename.endswith(".json"):
            filepath = os.path.join(char_dir, filename)
            try:
                with open(filepath, "r", encoding="utf-8") as f:
                    c_data = json.load(f)
            except Exception as e:
                print(f"Error reading {filename}: {e}")
                continue

            c_id = c_data.get("id")
            if c_id in ds_data and len(ds_data[c_id]) > 0:
                top_img = ds_data[c_id][0]["url"]
                photo_list = [item["url"] for item in ds_data[c_id][:30]]

                c_data["avatar_url"] = top_img
                c_data["local_photos"] = photo_list

                # Also update image triggers in intents if any
                if "intents" in c_data:
                    for intent in c_data["intents"]:
                        if "responses" in intent:
                            new_responses = []
                            for resp in intent["responses"]:
                                # Replace local prompt trigger with direct dataset trigger
                                if "[IMAGE_TRIGGER:" in resp:
                                    resp = resp.split("[IMAGE_TRIGGER:")[0].strip() + f" [IMAGE_TRIGGER: {c_id} dataset photo]"
                                new_responses.append(resp)
                            intent["responses"] = new_responses

                with open(filepath, "w", encoding="utf-8") as f:
                    json.dump(c_data, f, indent=2)

                print(f"Updated {c_id}: avatar -> {top_img[:45]}...")
                updated_count += 1

    print(f"\nSUCCESS: Updated {updated_count} character JSON files with 100% Parquet Dataset URLs!")

if __name__ == "__main__":
    main()
