import os
import json
import time
import pyarrow.dataset as ds
import pyarrow.compute as pc

def main():
    print("=======================================================")
    print(" STRICT PARQUET DATASET INDEXER (PRECISE DANBOORU TAGS)")
    print("=======================================================")

    parquet_path = os.path.join("dataset", "metadata.parquet")
    output_index_path = os.path.join("dataset", "dataset_index.json")

    if not os.path.exists(parquet_path):
        print(f"Error: {parquet_path} not found!")
        return

    # STRICT DANBOORU CHARACTER TAG MAP
    char_map = {
        "tsunade": {"pattern": "tsunade", "tier": "uncensored"},
        "rias": {"pattern": "rias_gremory", "tier": "uncensored"},
        "ruby": {"pattern": "hoshino_ruby", "tier": "safe"},
        "ino": {"pattern": "yamanaka_ino", "tier": "uncensored"},
        "hancock": {"pattern": "boa_hancock", "tier": "uncensored"},
        "nami": {"pattern": "nami_\\(one_piece\\)", "tier": "uncensored"},
        "aki": {"pattern": "(nijou_aki|aki_nijou)", "tier": "uncensored"},
        "akeno": {"pattern": "(himejima_akeno|akeno_himejima)", "tier": "uncensored"},
        "ikumi": {"pattern": "(mito_ikumi|ikumi_mito)", "tier": "uncensored"},
        "ebina": {"pattern": "ebina_nana", "tier": "uncensored"},
        "yaemiko": {"pattern": "yae_miko", "tier": "uncensored"},
        "hinata": {"pattern": "(hyuuga_hinata|hinata_\\(naruto\\))", "tier": "medium"},
        "sakura": {"pattern": "(haruno_sakura|sakura_\\(naruto\\))", "tier": "medium"},
        "asuna": {"pattern": "(yuuki_asuna|asuna_\\(sao\\))", "tier": "medium"},
        "furina": {"pattern": "(furina_\\(genshin_impact\\)|furina)", "tier": "medium"},
        "hutao": {"pattern": "(hu_tao_\\(genshin_impact\\)|hu_tao)", "tier": "uncensored"},
        "lumine": {"pattern": "(lumine_\\(genshin_impact\\)|lumine)", "tier": "medium"},
        "raiden": {"pattern": "(raiden_shogun|raiden_ei)", "tier": "medium"},
        "ai": {"pattern": "hoshino_ai", "tier": "safe"},
        "akane": {"pattern": "kurokawa_akane", "tier": "safe"},
        "miku": {"pattern": "nakano_miku", "tier": "safe"},
        "itsuki": {"pattern": "nakano_itsuki", "tier": "safe"},
        "ganyu": {"pattern": "(ganyu_\\(genshin_impact\\)|ganyu)", "tier": "uncensored"},
        "keqing": {"pattern": "(keqing_\\(genshin_impact\\)|keqing)", "tier": "uncensored"},
        "barbara": {"pattern": "barbara_\\(genshin_impact\\)", "tier": "uncensored"},
        "xilonen": {"pattern": "(xilonen_\\(genshin_impact\\)|xilonen)", "tier": "uncensored"}
    }

    tier_ratings = {
        "uncensored": ["q", "e", "s"],
        "medium": ["s", "q", "g"],
        "safe": ["g", "s"]
    }

    start_time = time.time()
    print("Loading Parquet Dataset into Memory...")
    dset = ds.dataset(parquet_path, format="parquet")
    cols = ["tag_string_character", "rating", "file_url", "large_file_url", "preview_file_url", "score", "tag_string_general"]
    
    results = {char_id: [] for char_id in char_map}
    total_scanned = 0

    for batch in dset.to_batches(columns=cols):
        total_scanned += batch.num_rows
        char_tags = batch.column("tag_string_character")

        for char_id, info in char_map.items():
            if len(results[char_id]) >= 80:
                continue

            pat = info["pattern"]
            allowed = tier_ratings[info["tier"]]

            # Vectorized regex match
            mask = pc.match_substring_regex(char_tags, pat, ignore_case=True)
            sub_table = batch.filter(mask)

            if sub_table.num_rows > 0:
                sub_dict = sub_table.to_pydict()
                for i in range(sub_table.num_rows):
                    rate = str(sub_dict["rating"][i] or "g").lower()
                    if rate not in allowed:
                        continue
                    
                    img = sub_dict["large_file_url"][i] or sub_dict["file_url"][i] or sub_dict["preview_file_url"][i]
                    if not img:
                        continue

                    gen_tags = str(sub_dict["tag_string_general"][i] or "").lower()

                    if len(results[char_id]) < 80:
                        results[char_id].append({
                            "url": img,
                            "preview": sub_dict["preview_file_url"][i] or img,
                            "rating": rate,
                            "score": sub_dict["score"][i] or 0,
                            "tags": gen_tags[:150]
                        })

    # Sort each character's images by score descending so top cover image is highest score masterpiece
    for char_id in results:
        results[char_id].sort(key=lambda x: x["score"], reverse=True)

    elapsed = round(time.time() - start_time, 2)
    print(f"\nIndexing complete in {elapsed}s! Scanned {total_scanned} rows.")
    for char_id, items in results.items():
        tier = char_map[char_id]["tier"].upper()
        print(f"  - {char_id} ({tier}): {len(items)} dataset images indexed (Top Score: {items[0]['score'] if items else 0})")

    # Save index JSON
    with open(output_index_path, "w", encoding="utf-8") as f:
        json.dump({
            "updated_at": time.strftime("%Y-%m-%d %H:%M:%S"),
            "total_characters": len(results),
            "characters": results
        }, f, indent=2)

    print(f"\nSaved dataset index to {output_index_path}")

if __name__ == "__main__":
    main()
