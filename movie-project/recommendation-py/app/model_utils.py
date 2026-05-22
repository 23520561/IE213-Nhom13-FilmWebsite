import pickle
import numpy as np

def save_artifact(obj, path):
    with open(path, 'wb') as f:
        pickle.dump(obj, f)

def load_artifact(path):
    with open(path, 'rb') as f:
        return pickle.load(f)

def save_numpy(arr, path):
    np.save(path, arr)

def load_numpy(path):
    return np.load(path)