# N.A.I.D
## Network Intrusion and Anomaly Detector:
This project uses machine learning to analyze network traffic and classify it as either normal or anomalous, indicating a potential threat.  Threat detected Anomalous network activity, which can indicate port scanning, denial-of-service attempts, or other unauthorized behavior. 

### Threats : </br>
Anomalous network activity, which can indicate port scanning, denial-of-service attempts, or other unauthorized behavior. </br>

### Technology stack </br> 
#### Language: 
Python </br> 
#### Libraries: 
Scapy for sniffing and analyzing network packets, scikit-learn for the machine learning model, and Pandas for data processing. </br> 
#### AI Model: 
A simple IsolationForest or RandomForestClassifier for anomaly detection. </br> 

### Project steps: </br> 
#### Collect network data: 
Use the Scapy library to capture packets on your local network interface. For a simple project, you can simulate traffic with tools like hping3 or use a pre-existing dataset like the KDDCup dataset.</br> 
#### Extract features: 
Process the captured packets to extract relevant features for your model, such as the source and destination IP addresses, port numbers, and packet size.</br>
#### Train the model: 
Using a dataset of both normal and malicious network traffic, train your scikit-learn model to recognize the patterns of normal activity.</br>
#### Detect anomalies: 
After training, feed new, live network traffic to your model. Any significant deviation from the normal pattern will be flagged as an anomaly.</br>
#### Trigger an alert: 
When an anomaly is detected, the system can print an alert to the console or log the details of the suspicious activity.</br>

# Final Project Structure : 
N.I.A.D/ </br> 
│
├── backend/ </br> 
│   ├── app.py                # Flask/FastAPI server </br> 
│   ├── preprocess.py         # Clean + encode + scale NSL-KDD data </br> 
│   ├── train_model.py        # Train and save ML model </br> 
│   ├── test_model.py         # Evaluate accuracy</br> 
│   ├── models/</br>
│   │   └── niad_model.pkl    # Saved trained model</br>
│   ├── data/</br>
│   │   └── KDDTrain+.txt</br>
│   │   └── KDDTest+.txt</br>
│   ├── requirements.txt      # Dependencies</br>
│   └── backend.md            # Your progress documentation</br>
│</br>
frontend/ </br>
│
├── index.html  </br>
├── style.css    </br>
├── script.js    </br>
├── assets/      </br>
│   ├── logo.png  </br>
│   └── icons/     </br>
└── libs/ </br> 
    ├── chart.js     </br>
    └── anime.min.js  </br>
│</br>
├── README.md                 # Project summary + how to run</br>
└── .gitignore</br>

API to be used - Flask/ Auth0
