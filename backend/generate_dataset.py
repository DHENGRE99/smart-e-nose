import pandas as pd
import numpy as np

np.random.seed(42)

def generate_citrus_data(n=500):
    rows = []

    for _ in range(n // 3):
        rows.append({
            "mq135": np.random.randint(80, 150),
            "mq4":   np.random.randint(40, 90),
            "mq3":   np.random.randint(50, 100),
            "temperature": np.random.uniform(10, 20),
            "humidity": np.random.uniform(40, 60),
            "status": "Fresh",
            "shelf_life_days": np.random.randint(5, 8),
            "fruit": np.random.choice(["Orange", "Lemon"])
        })

    for _ in range(n // 3):
        rows.append({
            "mq135": np.random.randint(150, 250),
            "mq4":   np.random.randint(90, 180),
            "mq3":   np.random.randint(100, 190),
            "temperature": np.random.uniform(20, 30),
            "humidity": np.random.uniform(60, 75),
            "status": "Medium",
            "shelf_life_days": np.random.randint(2, 5),
            "fruit": np.random.choice(["Orange", "Lemon"])
        })

    for _ in range(n // 3):
        rows.append({
            "mq135": np.random.randint(250, 400),
            "mq4":   np.random.randint(180, 350),
            "mq3":   np.random.randint(190, 380),
            "temperature": np.random.uniform(30, 45),
            "humidity": np.random.uniform(75, 95),
            "status": "Spoiled",
            "shelf_life_days": 0,
            "fruit": np.random.choice(["Orange", "Lemon"])
        })

    df = pd.DataFrame(rows).sample(frac=1).reset_index(drop=True)
    return df

df = generate_citrus_data()
df.to_csv("dataset.csv", index=False)
print(f"Dataset created: {len(df)} rows")
print(df["status"].value_counts())